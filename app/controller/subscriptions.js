const mongoose = require("mongoose");
const joi = require("joi");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const assert = require("assert");
const subMonths = require("date-fns/subMonths");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const Subscription = require("../model/subscription");
const Account = require("../model/account");
const Plan = require("../model/plan");
const User = require("../model/user");

const { Types } = mongoose;

function toExternal(subscription) {
    const account = subscription.account;
    const plan = subscription.plan;
    const result = {
        id: subscription.id,
        ownerId: subscription.ownerId,
        planId: subscription.planId,
        accountId: subscription.accountId,
        quantity: subscription.quantity,
        billingPeriod: subscription.billingPeriod,
        billingPeriodUnit: subscription.billingPeriodUnit,
        setupFee: subscription.setupFee,
        trialPeriod: subscription.trialPeriod,
        trialPeriodUnit: subscription.trialPeriodUnit,
        term: subscription.term,
        termUnit: subscription.termUnit,
        renews: subscription.renews,
        startsAt: subscription.startsAt,
        activatedAt: subscription.activatedAt,
        cancelledAt: subscription.cancelledAt,
        pausedAt: subscription.pausedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
    };

    if (account) {
        result.account = {
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

    if (plan) {
        result.plan = {
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

    return result;
}

const subscriptionSchema = joi.object({
    accountId: joi.string().length(24).required(),
    planId: joi.string().length(24).required(),
    quantity: joi.number().integer().required(),
    billingPeriod: joi.number().integer().allow(null).default(null),
    billingPeriodUnit: joi.string().valid("days", "months").default("days"),
    setupFee: joi.number().allow(null).default(null),
    trialPeriod: joi.number().integer().allow(null).default(null),
    trialPeriodUnit: joi.string().valid("days", "months").default("days"),
    term: joi.number().integer().default(null),
    termUnit: joi.string().valid("days", "months").default("days"),
    startsAt: joi.date().required(),
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
});

// NOTE: Input is not sanitized to prevent XSS attacks.
// TODO: Check the dates if they are future, past, and present WRT the nature of the attribute.
function attachRoutes(router) {
    router.post("/subscriptions", async (request, response) => {
        const body = request.body;
        const parameters = {
            accountId: body.accountId,
            planId: body.planId,
            quantity: body.quantity,
            billingPeriod: body.billingPeriod,
            billingPeriodUnit: body.billingPeriodUnit,
            setupFee: body.setupFee,
            trialPeriod: body.trialPeriod,
            trialPeriodUnit: body.trialPeriodUnit,
            term: body.term,
            termUnit: body.termUnit,
            startsAt: body.startsAt,
            renews: body.renews,
        };
        const { error, value } = subscriptionSchema.validate(parameters);
        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const owner = await User.findById(ownerId).exec();
        if (!owner) {
            throw new Error(
                "Cannot find an user for `request.user.identifier`."
            );
        }

        /* Ensure that the plan is owned by the current user. */
        const planId = new Types.ObjectId(value.planId);
        const plan = await Plan.findById(planId).and([{ ownerId }]).exec();
        if (!plan) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified plan identifier is invalid.",
            });
        }

        /* Ensure that the account is owned by the current user. */
        const accountId = new Types.ObjectId(value.accountId);
        const account = await Account.findById(accountId)
            .and([{ ownerId }])
            .exec();
        if (!account) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified account identifier is invalid.",
            });
        }

        /* Ensure that the plan is not subscribed by the account. */
        const subscriptions = await Subscription.find({
            _id: { $in: account.subscriptionIds },
            ownerId,
        }).exec();
        const subscribed =
            subscriptions.findIndex(
                (item) => item.planId.toString() === value.planId.toString()
            ) >= 0;
        if (subscribed) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified plan is already subscribed.",
            });
        }

        value.ownerId = ownerId;
        const newSubscription = new Subscription(value);
        await newSubscription.save();

        account.subscriptionIds.push(newSubscription._id);
        await account.save();

        response.status(httpStatus.CREATED).json(toExternal(newSubscription));
    });

    router.get("/subscriptions", async (request, response) => {
        const query = request.query;
        const parameters = {
            page: query.page,
            limit: query.limit,
            dateRange: query.date_range,
            startDate: query.start_date,
            endDate: query.end_date,
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

        console.log(filters);

        const subscriptions = await Subscription.paginate(filters, {
            limit: value.limit,
            page: value + 1,
            lean: true,
            leanWithId: true,
            pagination: true,
        });

        /* As the docs indicate, we cannot use `$lookup`` on a sharded collection. We will shard
         * the collection in the futurue. Therefore, the best practice workaround is to perform
         * the lookup in a separate query.
         */
        const accountIds = [];
        const planIds = [];
        subscriptions.docs.forEach((subscription) => {
            accountIds.push(subscription.accountId);
            planIds.push(subscription.planId);
        });
        const accounts = await Account.find({
            _id: { $in: accountIds },
        }).exec();
        const plans = await Plan.find({ _id: { $in: planIds } }).exec();

        const accountById = {};
        accounts.forEach((account) => (accountById[account.id] = account));

        const planById = {};
        plans.forEach((plan) => (planById[plan.id] = plan));

        subscriptions.docs.forEach((subscription) => {
            subscription.account = accountById[subscription.accountId];
            subscription.plan = planById[subscription.planId];
        });

        const result = {
            totalRecords: subscriptions.totalDocs,
            page: value.page,
            limit: subscriptions.limit,
            totalPages: subscriptions.totalPages,
            previousPage: subscriptions.prevPage
                ? subscriptions.prevPage - 1
                : null,
            nextPage: subscriptions.nextPage
                ? subscriptions.nextPage - 1
                : null,
            hasPreviousPage: subscriptions.hasPrevPage,
            hasNextPage: subscriptions.hasNextPage,
        };
        result.records = subscriptions.docs.map(toExternal);
        response.status(httpStatus.OK).json(result);

        console.log(result);
    });

    /* A subscription created by one user should be hidden from another user. */
    router.get("/subscriptions/:id", async (request, response) => {
        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.id);
        const subscription = await Subscription.findById(id)
            .and([{ ownerId }])
            .exec();
        if (subscription) {
            const plan = await Plan.findById(subscription.planId).exec();
            const account = await Account.findById(
                subscription.accountId
            ).exec();
            if (!plan || !account) {
                throw new Error(
                    "Cannot find plan or account for the subscription!"
                );
            }

            subscription.account = account;
            subscription.plan = plan;
            return response
                .status(httpStatus.OK)
                .json(toExternal(subscription));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message:
                "Cannot find a subscription with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
