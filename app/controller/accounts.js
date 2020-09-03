const mongoose = require("mongoose");
const joi = require("joi");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Account = require("../model/account");

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
    page: joi.number().integer().default(1),
    limit: joi
        .number()
        .integer()
        .min(10)
        .max(constants.PAGINATE_MAX_LIMIT)
        .default(20),
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

        /* If a deleted account already uses the specified user name, the new account cannot
         * use it.
         */
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

        value.ownerId = ownerId;
        value.deleted = false;
        const newAccount = new Account(value);
        await newAccount.save();

        response.status(httpStatus.CREATED).json(toExternal(newAccount));
    });

    router.get("/accounts", async (request, response) => {
        const body = request.body;
        const parameters = {
            page: body.page,
            limit: body.limit,
        };
        const { error, value } = filterSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const accounts = await Account.paginate(
            { ownerId, deleted: false },
            {
                limit: value.limit,
                page: value,
                lean: true,
                leanWithId: true,
                pagination: true,
            }
        );
        response.status(httpStatus.OK).json(accounts.docs.map(toExternal));
    });

    const identifierPattern = /^[a-z0-9]{24}$/;
    /* An account created by one user should be hidden from another user. */
    router.get("/accounts/:identifier", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified account identifier is invalid.",
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.identifier);
        const account = await Account.findById(id)
            .and([{ ownerId: ownerId }, { deleted: false }])
            .exec();
        if (account) {
            return response.status(httpStatus.OK).json(toExternal(account));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an account with the specified identifier.",
        });
    });

    router.put("/accounts/:identifier", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
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
        const _id = new Types.ObjectId(request.params.identifier);
        const ownerId = new Types.ObjectId(request.user.identifier);

        const account = await Account.findOneAndUpdate(
            { _id, ownerId, deleted: false },
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

    router.delete("/accounts/:identifier", async (request, response) => {
        const _id = new Types.ObjectId(request.params.identifier);
        const ownerId = new Types.ObjectId(request.user.identifier);
        const account = await Account.findOneAndUpdate(
            { _id, ownerId, deleted: false },
            { deleted: true },
            { new: true }
        ).exec();
        if (account) {
            response.status(httpStatus.NO_CONTENT).send();
        } else {
            response.status(httpStatus.NOT_FOUND).json({
                message:
                    "Cannot find an account with the specified identifier.",
            });
        }
    });
}

module.exports = {
    attachRoutes,
};
