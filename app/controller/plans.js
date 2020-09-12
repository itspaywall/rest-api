const mongoose = require("mongoose");
const joi = require("joi");
const assert = require("assert");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Plan = require("../model/plan");
const subMonths = require("date-fns/subMonths");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const misc = require("../util/misc");

const { Types } = mongoose;

function toExternal(plan) {
    return {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        billingPeriod: plan.billigPeriod,
        billingPeriodUnit: plan.billigPeriodUnit,
        pricePerBillingPeriod: plan.pricePerBillingPeriod,
        setupFee: plan.setupFee,
        trialPeriod: plan.trialPeriod,
        trialPeriodUnit: plan.trialPeriodUnit,
        term: plan.term,
        termUnit: plan.termUnit,
        renews: plan.renews,
        createdAt: plan.createdAt,
    };
}

const planSchema = joi.object({
    name: joi.string().trim().min(2).max(100).required(),
    code: joi.string().trim().lowercase().alphanum().min(2).max(20).required(),
    description: joi
        .string()
        .trim()
        .max(200)
        .allow(null)
        .empty("")
        .default(null),
    billingPeriod: joi.number().integer().required(),
    billingPeriodUnit: joi.string().valid("days", "months").required(),
    pricePerBillingPeriod: joi.number().required(),
    setupFee: joi.number().default(0),
    trialPeriod: joi.number().integer().default(0),
    trialPeriodUnit: joi.string().valid("days", "months").default("days"),
    term: joi.number().integer().default(0),
    termUnit: joi.string().valid("days", "months").default("term"),
    renews: joi.boolean().default(true),
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

// NOTE: Input is not sanitized to prevent XSS attacks.
function attachRoutes(router) {
    router.post("/plans", async (request, response) => {
        const body = request.body;
        const parameters = {
            name: body.name,
            code: body.code,
            description: body.description,
            billingPeriod: body.billingPeriod,
            billingPeriodUnit: body.billingPeriodUnit,
            pricePerBillingPeriod: body.pricePerBillingPeriod,
            setupFee: body.setupFee,
            trialPeriod: body.trialPeriod,
            trialPeriodUnit: body.trialPeriodUnit,
            term: body.term,
            termUnit: body.termUnit,
            renews: body.renews,
        };
        const { error, value } = planSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }
        /* If a deleted plan already uses the specified code, the new plan cannot
         * use it.
         */
        const ownerId = new Types.ObjectId(request.user.identifier);
        const plan = await Plan.findOne({
            code: value.code,
            ownerId,
        }).exec();

        if (plan) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "A plan with the specified code already exists.",
            });
        }

        value.ownerId = ownerId;
        value.deleted = false;
        const newPlan = new Plan(value);
        await newPlan.save();

        response.status(httpStatus.CREATED).json(toExternal(newPlan));
    });

    router.get("/plans", async (request, response) => {
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
            deleted: false,
        };
        if (dateRange !== "all_time") {
            filters.createdAt = {
                $gte: startOfDay(startDate),
                $lte: endOfDay(endDate),
            };
        }

        if (value.search) {
            const regex = new RegExp(misc.escapeRegex(value.search), "i");
            filters.$or = [{ code: regex }, { name: regex }];
        }

        const plans = await Plan.paginate(filters, {
            limit: value.limit,
            page: value.page + 1,
            lean: true,
            leanWithId: true,
            pagination: true,
        });

        const result = {
            totalRecords: plans.totalDocs,
            page: value.page,
            limit: plans.limit,
            totalPages: plans.totalPages,
            previousPage: plans.prevPage ? plans.prevPage - 1 : null,
            nextPage: plans.nextPage ? plans.nextPage - 1 : null,
            hasPreviousPage: plans.hasPrevPage,
            hasNextPage: plans.hasNextPage,
        };
        result.records = plans.docs.map(toExternal);
        response.status(httpStatus.OK).json(result);
    });

    const identifierPattern = /^[a-z0-9]{24}$/;
    /* A plan created by one user should be hidden from another user. */
    router.get("/plans/:identifier", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified plan identifier is invalid.",
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.identifier);
        const plan = await Plan.findById(id)
            .and([{ ownerId }, { deleted: false }])
            .exec();
        if (plan) {
            return response.status(httpStatus.OK).json(toExternal(plan));
        }
        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find a plan with the specified identifier.",
        });
    });

    router.put("/plans/:identifier", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified plan identifier is invalid.",
            });
        }

        const body = request.body;
        const parameters = {
            name: body.name,
            code: body.code,
            description: body.description,
            billingPeriod: body.billingPeriod,
            billingPeriodUnit: body.billingPeriodUnit,
            pricePerBillingPeriod: body.pricePerBillingPeriod,
            setupFee: body.setupFee,
            trialPeriod: body.trialPeriod,
            trialPeriodUnit: body.trialPeriodUnit,
            term: body.term,
            termUnit: body.termUnit,
            renews: body.renews,
        };
        const { error, value } = planSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }
        const _id = new Types.ObjectId(request.params.identifier);
        const ownerId = new Types.ObjectId(request.user.identifier);

        const plan = await Plan.findOneAndUpdate(
            { _id, ownerId, deleted: false },
            value,
            { new: true }
        ).exec();
        if (plan) {
            return response.status(httpStatus.OK).json(toExternal(plan));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find a plan with the specified identifier.",
        });
    });

    router.delete("/plans/:identifier", async (request, response) => {
        const _id = new Types.ObjectId(request.params.identifier);
        const ownerId = new Types.ObjectId(request.user.identifier);
        const plan = await Plan.findOneAndUpdate(
            { _id, ownerId, deleted: false },
            { deleted: true },
            { new: true }
        ).exec();
        if (plan) {
            return response.status(httpStatus.NO_CONTENT).send();
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find a plan with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
