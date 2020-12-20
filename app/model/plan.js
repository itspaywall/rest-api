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
    billingCyclePeriod: {
        type: Number,
        required: true,
        validate: validateInteger,
    },
    billingCyclePeriodUnit: {
        type: String,
        required: true,
        enum: ["days", "months"],
    },
    pricePerBillingCycle: {
        type: Number,
        required: true,
    },
    setupFee: {
        type: Number,
        default: 0,
    },
    totalBillingCycles: {
        type: Number,
        required: true,
        validate: validateInteger,
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
    renews: {
        type: Boolean,
        default: true,
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

planSchema.index({
    name: "text",
    code: "text",
});
planSchema.plugin(paginate);
const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
