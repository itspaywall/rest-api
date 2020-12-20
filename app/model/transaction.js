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

const transactionSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    comments: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        enum: ["purchase", "refund", "verify"],
        required: true,
    },
    /* Action   | Reference
     * ----------------------
     * purchase | invoice
     * refund   | transaction
     * verify   | subscription
     */
    referenceId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "credit_card", "debit_card", "online"],
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
});

transactionSchema.plugin(paginate);
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
