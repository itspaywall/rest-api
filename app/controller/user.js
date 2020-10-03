const mongoose = require("mongoose");
const joi = require("joi");
const assert = require("assert");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const User = require("../model/user");
const misc = require("../util/misc");

const { Types } = mongoose;

function toExternal(user) {
    return {
        organizationId: user.organizationId,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        password: user.password,
        role: user.role,
    };
}

const userSchema = joi.object({
    firstName: joi.string().trim().min(3).max(40).required(),
    lastName: joi.string().trim().min(3).max(40).required(),
    emailAddress: joi.string().email().trim().max(255).required(),
    password: joi.string().email().trim().required(),
    role: joi.string().email().trim().required(),
});

function attachRoutes(router) {
    router.post("/users", async (request, response) => {
        const body = request.body;
        const parameters = {
            organizationId: user.organizationId,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            password: user.password,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        const { error, value } = userSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        const newUser = new User(value);
        newUser.ownerId = new Types.ObjectId(request.user.identifier);
        await newUser.save();

        response.status(httpStatus.CREATED).json(toExternal(newUser));
    });

    const identifierPattern = /^[a-z0-9]{24}$/;
    /* An user created by one user should be hidden from another user. */
    router.get("/users/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified user identifier is invalid.",
            });
        }

        const id = new Types.ObjectId(request.params.identifier);
        const user = await User.findById(id).exec();
        if (user) {
            return response.status(httpStatus.OK).json(toExternal(user));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an user with the specified identifier.",
        });
    });

    router.put("/users/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified user identifier is invalid.",
            });
        }

        const body = request.body;
        const parameters = {
            organizationId: user.organizationId,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            password: user.password,
            role: user.role,
        };
        const { error, value } = userSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }
        const _id = new Types.ObjectId(request.params.identifier);

        const user = await User.findOneAndUpdate({ _id }, value, {
            new: true,
        }).exec();
        if (user) {
            return response.status(httpStatus.OK).json(toExternal(user));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an user with the specified identifier.",
        });
    });

    router.put("/users/:id/update-password", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified user identifier is invalid.",
            });
        }

        const body = request.body;
        const parameters = {
            organizationId: user.organizationId,
            emailAddress: user.emailAddress,
            password: user.password,
            role: user.role,
        };
        const { error, value } = userSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
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

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an user with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
