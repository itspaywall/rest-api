/*
 * Copyright 2017-2020 Samuel Rowe, Joel E. Rego
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const itemSchema = new Schema({
    _id: false,
    referenceId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    type: {
        required: true,
        type: String,
        enum: ["setup_fee", "addon"],
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
        type: String,
        maxlength: 300,
    },
    termsAndConditions: {
        type: String,
        maxlength: 300,
    },
    items: {
        required: true,
        type: [itemSchema],
    },
    createdAt: {
        required: true,
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        required: true,
        type: Date,
        default: Date.now,
    },
    dueAt: {
        required: true,
        type: Date,
    },
    closedAt: {
        type: Date,
    },
});

invoiceSchema.index({
    invoiceNumber: "text",
});
invoiceSchema.plugin(paginate);
const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
