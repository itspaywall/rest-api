const mongoose = require("mongoose");
const joi = require("joi");
const httpStatus = require("../util/httpStatus");
const Subscription = require("../model/Subscription");
const Account = require("../model/Account");
const Plan = require("../model/Plan");
const User = require("../model/User");

const { Types } = mongoose;

function toExternal(subscription) {
    return {
        id: subscription.id,
        ownerId: subscription.ownerId,
        planId: subscription.planId,
        accountId: subscription.accountId,
        quantity: subscription.quantity,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        setupFee: subscription.setupFee,
        term: subscription.term,
        termUnit: subscription.termUnit,
        renews: subscription.renews,
        activatedAt: subscription.activatedAt,
        cancelledAt: subscription.cancelledAt,
        pausedAt: subscription.pausedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
    };
}

// NOTE: Input is not sanitized to prevent XSS attacks.
function attachRoutes(router) {
    const newSubscriptionSchema = joi.object({
        planId: joi.string().length(24).required(),
        accountId: joi.string().length(24).required(),
        quantity: joi.number().integer().required(),
        trialStart: joi.date().required(),
        trialEnd: joi.date().required(),
        setupFee: joi.number().required(),
        term: joi.number().integer().required(),
        termUnit: joi.string().valid("days", "months").required(),
        renews: joi.boolean().default(true),
    });

    router.post("/subscriptions", async (request, response) => {
        const body = request.body;
        const parameters = {
            planId: body.planId,
            accountId: body.accountId,
            quantity: body.quantity,
            trialStart: body.trialStart,
            trialEnd: body.trialEnd,
            setupFee: body.setupFee,
            term: body.term,
            termUnit: body.termUnit,
            renews: body.renews,
        };
        const { error, value } = newSubscriptionSchema.validate(parameters);
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

        /* Ensure that the plan is owned by the current user and not deleted. */
        const planId = new Types.ObjectId(value.planId);
        const plan = await Plan.findById(planId)
            .and([{ ownerId, deleted: false }])
            .exec();
        if (!plan) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified plan identifier is invalid.",
            });
        }

        /* Ensure that the account is owned by the current user and not deleted. */
        const accountId = new Types.ObjectId(value.accountId);
        const account = await Account.findById(accountId)
            .and([{ ownerId }, { deleted: false }])
            .exec();
        if (!account) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified account identifier is invalid.",
            });
        }

        /* Ensure that the plan is not subscribed by the account. */
        const subscriptions = await Subscription.find({
            _id: { $in: account.subscriptions },
            ownerId,
        }).exec();
        const subscribed =
            subscriptions.findIndex((item) => item.planId == value.planId) >= 0;
        if (subscribed) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified plan is already subscribed.",
            });
        }

        value.ownerId = ownerId;
        const newSubscription = new Subscription(value);
        await newSubscription.save();

        account.subscriptions.push(newSubscription._id);
        await account.save();

        response.status(httpStatus.CREATED).json(toExternal(newSubscription));
    });

    /* A subscription created by one user should be hidden from another user. */
    router.get("/subscriptions/:id", async (request, response) => {
        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.id);
        const subscription = await Subscription.findById(id)
            .and([{ ownerId }, { deleted: false }])
            .exec();
        if (subscription) {
            response.status(httpStatus.OK).json(toExternal(subscription));
        } else {
            response.status(httpStatus.NOT_FOUND).json({
                message:
                    "Cannot find a subscription with the specified identifier.",
            });
        }
    });
}

module.exports = {
    attachRoutes,
};
