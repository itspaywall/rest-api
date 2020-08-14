const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const validateInteger = {
    validator: Number.isInteger,
    message: (props) => `${props.value} should be an integer.`,
};

const planSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    name: {
        type: String,
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        minlength: 2,
        maxlength: 20,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        maxlength: 200,
        trim: true,
    },
    billingPeriod: {
        type: Number,
        required: true,
        validate: validateInteger,
    },
    billingPeriodUnit: {
        type: String,
        required: true,
        enum: ["days", "months"],
    },
    pricePerBillingPeriod: {
        type: Number,
        required: true,
    },
    setupFee: {
        type: Number,
        default: 0,
    },
    trialPeriod: {
        type: Number,
        validate: validateInteger,
        default: 0,
    },
    trialPeriodUnit: {
        type: String,
        enum: ["days", "months"],
        default: "days",
    },
    term: {
        type: Number,
        validate: validateInteger,
        default: 0,
    },
    termUnit: {
        type: String,
        enum: ["days", "months"],
        default: "days",
    },
    renews: {
        type: Boolean,
        default: true,
    },
    createdOn: {
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

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
