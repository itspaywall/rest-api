const mongoose = require("mongoose");
const joi = require("joi");
const httpStatus = require("../util/httpStatus");
const Plan = require("../model/Plan");

const { Types } = mongoose;

function toExternal(plan) {
    return {
        identifier: plan.id,
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
        createdOn: plan.createdOn,
    };
}

// NOTE: Input is not sanitized to prevent XSS attacks.
function attachRoutes(router) {
    const planSchema = joi.object({
        name: joi.string().trim().lowercase().min(2).max(100).required(),
        code: joi
            .string()
            .trim()
            .lowercase()
            .alphanum()
            .min(2)
            .max(20)
            .required(),
        description: joi.string().trim().max(200).default(""),
        billingPeriod: joi.number().integer().required(),
        billingPeriodUnit: joi.string().valid("days", "months").default("days"),
        pricePerBillingPeriod: joi.number().integer().required(),
        setupFee: joi.number().default(0),
        trialPeriod: joi.number().integer().default(0),
        trialPeriodUnit: joi.string().valid("days", "months").default("days"),
        term: joi.number().integer().default(0),
        termUnit: joi.string().valid("days", "months").default("term"),
        renews: joi.boolean().default(true),
    });
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
            response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        } else {
            /* If a deleted plan already uses the specified code, the new plan cannot
             * use it.
             */
            const ownerId = new Types.ObjectId(request.user.identifier);
            const plan = await Plan.findOne({
                code: value.code,
                ownerId,
            });

            if (plan) {
                response.status(httpStatus.BAD_REQUEST).json({
                    message: "A plan with the specified code already exists.",
                });
            } else {
                value.ownerId = ownerId;
                value.deleted = false;
                const newPlan = new Plan(value);
                await newPlan.save();

                response.status(httpStatus.CREATED).json(toExternal(newPlan));
            }
        }
    });
}

module.exports = {
    attachRoutes,
};
