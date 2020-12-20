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

const userSchema = new mongoose.Schema({
    firstName: {
        minlength: 3,
        maxlength: 40,
        required: true,
        unique: false,
        trim: true,
        type: String,
    },
    lastName: {
        minlength: 3,
        maxlength: 40,
        required: true,
        unique: false,
        trim: true,
        type: String,
    },
    emailAddress: {
        lowercase: true,
        maxlength: 255,
        required: true,
        unique: true,
        trim: true,
        type: String,
    },
    password: {
        required: true,
        type: String,
    },
    role: {
        required: true,
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
