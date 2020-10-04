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
    status: {
        type: String,
        required: true,
        enum: [
            /* The subscription was created and is neither in trial nor active. */
            "new",
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
    pricePerBillingCycle: {
        type: Number,
        required: true,
    },
    setupFee: {
        type: Number,
        default: 0,
        required: true,
    },
    quantity: {
        type: Number,
        validate: validateInteger,
        required: true,
    },
    startsAt: {
        type: Date,
        default: null,
        required: true,
    },
    currentBillingCycle: {
        type: Number,
        validate: validateInteger,
        min: 0,
        required: true,
    },
    totalBillingCycles: {
        type: Number,
        validate: validateInteger,
        required: true,
    },
    renews: {
        type: Boolean,
        default: true,
        required: true,
    },
    notes: {
        type: String,
        maxlength: 200,
        trim: true,
    },
    termsAndConditions: {
        type: String,
        maxlength: 200,
        trim: true,
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
