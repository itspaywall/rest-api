const mongoose = require("mongoose");
const joi = require("joi");
const assert = require("assert");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Account = require("../model/account");
const subMonths = require("date-fns/subMonths");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const misc = require("../util/misc");

const { Types } = mongoose;

function toExternal(account) {
    return {
        id: account.id,
        userName: account.userName,
        firstName: account.firstName,
        lastName: account.lastName,
        emailAddress: account.emailAddress,
        phoneNumber: account.phoneNumber,
        addressLine1: account.addressLine1,
        addressLine2: account.addressLine2,
        city: account.city,
        state: account.state,
        country: account.country,
        zipCode: account.zipCode,
        createdAt: account.createdAt,
    };
}

const accountSchema = joi.object({
    userName: joi
        .string()
        .trim()
        .alphanum()
        .lowercase()
        .min(3)
        .max(30)
        .required(),
    firstName: joi.string().trim().required(),
    lastName: joi.string().trim().required(),
    emailAddress: joi.string().email().trim().empty("").default(null),
    phoneNumber: joi.string().trim().allow(null).empty("").default(null),
    addressLine1: joi.string().trim().allow(null).empty("").default(null),
    addressLine2: joi.string().trim().allow(null).empty("").default(null),
    city: joi.string().trim().allow(null).empty("").default(null),
    state: joi.string().trim().allow(null).empty("").default(null),
    country: joi.string().trim().allow(null).empty("").default(null),
    zipCode: joi.string().trim().allow(null).empty("").default(null),
});

const filterSchema = joi.object({
    page: joi.number().integer().default(0),
    limit: joi
        .number()
        .integer()
        .min(10)
        .max(constants.PAGINATE_MAX_LIMIT)
        .default(20),
    dateRange: joi
        .string()
        .valid(
            "all_time",
            "last_3_months",
            "last_6_months",
            "last_9_months",
            "last_12_months",
            "last_15_months",
            "last_18_months",
            "custom"
        )
        .default("all_time"),
    startDate: joi
        .date()
        .when("date_range", { is: "custom", then: joi.required() }),
    endDate: joi
        .date()
        .when("date_range", { is: "custom", then: joi.required() }),
    search: joi.string().trim().allow(null).empty("").default(null),
});

function attachRoutes(router) {
    router.post("/accounts", async (request, response) => {
        const body = request.body;
        const parameters = {
            userName: body.userName,
            firstName: body.firstName,
            lastName: body.lastName,
            emailAddress: body.emailAddress,
            phoneNumber: body.phoneNumber,
            addressLine1: body.addressLine1,
            addressLine2: body.addressLine2,
            city: body.city,
            state: body.state,
            country: body.country,
            zipCode: body.zipCode,
        };
        const { error, value } = accountSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const account = await Account.findOne({
            userName: value.userName,
            ownerId,
        }).exec();

        if (account) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message:
                    "An account with the specified user name already exists.",
            });
        }

        const newAccount = new Account(value);
        newAccount.ownerId = ownerId;
        newAccount.subscriptionIds = [];
        await newAccount.save();

        response.status(httpStatus.CREATED).json(toExternal(newAccount));
    });

    router.get("/accounts", async (request, response) => {
        const query = request.query;
        const parameters = {
            page: query.page,
            limit: query.limit,
            dateRange: query.date_range,
            startDate: query.start_date,
            endDate: query.end_date,
            search: query.search,
        };
        const { error, value } = filterSchema.validate(parameters);
        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        let startDate = value.startDate;
        let endDate = value.endDate;
        const dateRange = value.dateRange;
        if (dateRange !== "custom" && dateRange !== "all_time") {
            const months = {
                last_3_months: 3,
                last_6_months: 6,
                last_9_months: 9,
                last_12_months: 12,
                last_15_months: 15,
                last_18_months: 18,
            };
            const amount = months[dateRange];
            assert(
                amount,
                "The specified date range is invalid. How did Joi let it through?"
            );
            startDate = subMonths(new Date(), amount);
            endDate = new Date();
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const filters = {
            ownerId,
        };
        if (dateRange !== "all_time") {
            filters.createdAt = {
                $gte: startOfDay(startDate),
                $lte: endOfDay(endDate),
            };
        }

        if (value.search) {
            const regex = new RegExp(misc.escapeRegex(value.search), "i");
            filters.$or = [
                { userName: regex },
                { firstName: regex },
                { lastName: regex },
            ];
        }

        const accounts = await Account.paginate(filters, {
            limit: value.limit,
            page: value.page + 1,
            lean: true,
            leanWithId: true,
            pagination: true,
        });

        const result = {
            totalRecords: accounts.totalDocs,
            page: value.page,
            limit: accounts.limit,
            totalPages: accounts.totalPages,
            previousPage: accounts.prevPage ? accounts.prevPage - 1 : null,
            nextPage: accounts.nextPage ? accounts.nextPage - 1 : null,
            hasPreviousPage: accounts.hasPrevPage,
            hasNextPage: accounts.hasNextPage,
        };
        result.records = accounts.docs.map(toExternal);
        response.status(httpStatus.OK).json(result);
    });

    /* An account created by one user should be hidden from another user. */
    const identifierPattern = /^[a-z0-9]{24}$/;
    router.get("/accounts/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.id)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified account identifier is invalid.",
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.id);
        const account = await Account.findById(id).and([{ ownerId }]).exec();
        if (account) {
            return response.status(httpStatus.OK).json(toExternal(account));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an account with the specified identifier.",
        });
    });

    router.put("/accounts/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.id)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified account identifier is invalid.",
            });
        }

        const body = request.body;
        const parameters = {
            userName: body.userName,
            firstName: body.firstName,
            lastName: body.lastName,
            emailAddress: body.emailAddress,
            phoneNumber: body.phoneNumber,
            addressLine1: body.addressLine1,
            addressLine2: body.addressLine2,
            city: body.city,
            state: body.state,
            country: body.country,
            zipCode: body.zipCode,
        };
        const { error, value } = accountSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }
        const _id = new Types.ObjectId(request.params.id);
        const ownerId = new Types.ObjectId(request.user.identifier);

        const account = await Account.findOneAndUpdate(
            { _id, ownerId },
            value,
            { new: true }
        ).exec();
        if (account) {
            return response.status(httpStatus.OK).json(toExternal(account));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an account with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
