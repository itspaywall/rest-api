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

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const joi = require("joi");
const User = require("../model/user");
const httpStatus = require("../util/httpStatus");
const configuration = require("../../configuration");

const JWT_LIFE_TIME = "7d";
const SALT_ROUNDS = 10;

const credentialsSchema = joi.object({
    emailAddress: joi.string().email().required(),
    password: joi.string().min(8).max(128).required(),
});

function createAccessToken(identifier) {
    return jwt.sign({ identifier }, configuration.secret, {
        issuer: configuration.issuer,
        audience: configuration.audience,
        expiresIn: JWT_LIFE_TIME,
        algorithm: "HS256",
    });
}

function toExternal(user) {
    return {
        accessToken: createAccessToken(user.id),
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
    };
}

function attachRoutes(router) {
    router.use((error, request, response, next) => {
        if (error.name === "UnauthorizedError") {
            response.status(httpStatus.UNAUTHORIZED).json({
                message: "Unauthorized access",
            });
        } else {
            next(error);
        }
    });

    router.post("/sessions", async (request, response) => {
        const parameters = {
            emailAddress: request.body.emailAddress,
            password: request.body.password,
        };

        const { error, value } = credentialsSchema.validate(parameters);

        if (error) {
            console.log(error);
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified email address or password is invalid.",
            });
        }

        const user = await User.findOne({
            emailAddress: value.emailAddress,
        }).exec();

        if (!user) {
            console.log("Invalid email address");
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified email address or password is invalid.",
            });
        }

        bcrypt.compare(value.password, user.password, (error) => {
            if (error) {
                console.log("Invalid password");
                return response.status(httpStatus.BAD_REQUEST).json({
                    message:
                        "The specified email address or password is invalid.",
                });
            }

            response.status(httpStatus.CREATED).send(toExternal(user));
        });
    });

    const postUsersSchema = joi.object({
        firstName: joi.string().trim().alphanum().min(3).max(40).required(),
        lastName: joi.string().trim().alphanum().min(3).max(40).required(),
        emailAddress: joi.string().email().required(),
        password: joi.string().min(8).max(128).required(),
    });

    router.post("/users", async (request, response) => {
        const parameters = {
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            emailAddress: request.body.emailAddress,
            password: request.body.password,
        };

        const { error, value } = postUsersSchema.validate(parameters);
        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        const user = await User.findOne({
            emailAddress: value.emailAddress,
        }).exec();
        if (user) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message:
                    "A user with the specified email address already exists.",
            });
        }

        bcrypt.hash(value.password, SALT_ROUNDS, (error, hashedPassword) => {
            if (error) {
                throw error;
            }

            value.password = hashedPassword;
            value.role = "REGULAR_USER";
            const newUser = new User(value);
            newUser.save((error) => {
                if (error) {
                    throw error;
                }

                response.status(httpStatus.CREATED).json(toExternal(newUser));
            });
        });
    });
}

module.exports = {
    attachRoutes,
};
