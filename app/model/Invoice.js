const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const invoiceItemSchema = new Schema({
    type: {
        required: true,
    },
    referenceId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    description: {
        required: true,
        type: String,
    },
    quantity: {
        required: true,
        type: Number,
    },
    startedAt: {
        required: true,
        type: Date,
    },
    endedAt: {
        required: true,
        type: Date,
    },
    subtotal: {
        required: true,
        type: Number,
    },
    total: {
        required: true,
        type: Number,
    },
});

// amountDue, paid
const invoiceSchema = new Schema({
    ownerId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    accountId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    subscriptionId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    invoiceNumber: {
        required: true,
        type: String,
    },
    status: {
        required: true,
        type: String,
        enum: [
            "pending",
            "overdue",
            "cancelled",
            "paid",
            "processing",
            "failed",
        ],
    },
    subtotal: {
        required: true,
        type: Number,
    },
    total: {
        required: true,
        type: Number,
    },
    origin: {
        required: true,
        type: String,
        enum: [
            "all",
            "purchase",
            "renewal",
            "immediate_change",
            "termination",
            "refund",
            "posted_credit",
            "gift_card_redemption",
            "write_off",
            "carryforward_credit",
            "carryforward_gift_credit",
            "usage_correction",
        ],
    },
    notes: {
        required: true,
        type: String,
        maxlength: 300,
    },
    termsAndConditions: {
        required: true,
        type: String,
        maxlength: 300,
    },
    items: {
        required: true,
        type: [invoiceItemSchema],
    },
    createdAt: {
        required: true,
        type: Date,
        default: Date.now,
    },
    dueAt: {
        required: true,
        type: Date,
    },
});

invoiceSchema.plugin(paginate);
const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
