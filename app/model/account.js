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

const accountSchema = new Schema({
    ownerId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    subscriptionIds: {
        required: true,
        type: [Schema.Types.ObjectId],
    },
    userName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    firstName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    lastName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    /*company: {
        type: String,
    },*/
    emailAddress: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    addressLine1: {
        type: String,
    },
    addressLine2: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    zipCode: {
        type: String,
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

accountSchema.index({
    userName: "text",
    firstName: "text",
    lastName: "text",
});
accountSchema.plugin(paginate);
const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
