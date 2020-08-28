const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const validateInteger = {
    validator: Number.isInteger,
    message: (props) => `${props.value} should be an integer.`,
};

const subscriptionSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    planId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    accountId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    quantity: {
        type: Number,
        validate: validateInteger,
        required: true,
    },
    trialStart: {
        type: Date,
        default: null,
        required: true,
    },
    trialEnd: {
        type: Date,
        default: null,
        required: true,
    },
    setupFee: {
        type: Number,
        default: 0,
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
    activatedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    cancelledAt: {
        type: Date,
        default: null,
        required: true,
    },
    pausedAt: {
        type: Date,
        default: null,
        required: true,
    },
    currentPeriodStart: {
        type: Date,
        default: Date.now,
        required: true,
    },
    currentPeriodEnd: {
        type: Date,
        default: Date.now,
        required: true,
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
    deleted: {
        type: Boolean,
        default: false,
        required: true,
    },
});

subscriptionSchema.plugin(paginate);
const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
