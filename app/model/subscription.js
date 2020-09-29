const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const validateInteger = {
    validator: Number.isInteger,
    message: (props) => `${props.value} should be an integer.`,
};

// The trial period does not necessarily have to coincide with the first billing cycle.
const subscriptionSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    accountId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    planId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    quantity: {
        type: Number,
        validate: validateInteger,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: [
            /* The subscription was created and is neither in trial nor active. */
            "future",
            "in_trial",
            "active",
            "pending",
            "halted",
            "canceled",
            "expired",
            "paused",
        ],
    },
    billingPeriod: {
        type: Number,
        validate: validateInteger,
        default: 0,
        required: true,
    },
    billingPeriodUnit: {
        type: String,
        enum: ["days", "months"],
        default: "days",
        required: true,
    },
    setupFee: {
        type: Number,
        default: 0,
        required: true,
    },
    trialPeriod: {
        type: Number,
        validate: validateInteger,
        default: 0,
        required: true,
    },
    trialPeriodUnit: {
        type: String,
        enum: ["days", "months"],
        default: "days",
        required: true,
    },
    term: {
        type: Number,
        validate: validateInteger,
        default: 0,
        required: true,
    },
    termUnit: {
        type: String,
        enum: ["days", "months"],
        default: "days",
        required: true,
    },
    renews: {
        type: Boolean,
        default: true,
        required: true,
    },
    startsAt: {
        type: Date,
        default: null,
        required: true,
    },
    activatedAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    pausedAt: {
        type: Date,
        default: null,
    },
    currentPeriodStart: {
        type: Date,
        default: null,
    },
    currentPeriodEnd: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

subscriptionSchema.plugin(paginate);
const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
