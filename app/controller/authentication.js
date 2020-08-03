const express = require("express");
const User = require("../model/User");
const httpStatus = require("..//util/httpStatus");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const joi = require("joi");
const configuration = require("../../configuration");
const jwtCheck = require("../middleware/jwtCheck");
const unless = require("../middleware/unless");
const requireRole = require("../middleware/requireRole");

const JWT_LIFE_TIME = "7d";
const SALT_ROUNDS = 10;
const router = express.Router();

function openAccess() {
    return (request) =>
        request.url !== "/users" &&
        request.url !== "/sessions" &&
        request.method !== "POST";
}

router.use("/", unless(openAccess, jwtCheck));

router.use("/", unless(openAccess, requireRole("REGULAR_USER")));

router.use((error, request, response, next) => {
    if (error.name === "UnauthorizedError") {
        response.status(httpStatus.UNAUTHORIZED).json({
            message: "Unauthorized access",
            error,
        });
    } else {
        next(error);
    }
});

function createAccessToken(identifier) {
    return jwt.sign({ identifier }, configuration.secret, {
        issuer: configuration.issuer,
        audience: configuration.audience,
        expiresIn: JWT_LIFE_TIME,
        algorithm: "HS256",
    });
}

const postSessionsSchema = joi.object({
    userName: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().min(8).max(128).required(),
});

router.post("/sessions", (request, response) => {
    const parameters = {
        userName: request.body.userName,
        password: request.body.password,
    };

    const { error, credentials } = postSessionsSchema.validate(parameters);

    if (error) {
        response.status(httpStatus.BAD_REQUEST).json({
            message: "The specified user name or password is invalid.",
        });
    } else {
        User.findOne({ userName: credentials.userName }).exec((error, user) => {
            if (error) {
                response.status(httpStatus.BAD_REQUEST).json({
                    message: "The specified user name or password is invalid.",
                });
            } else {
                bcrypt.compare(
                    credentials.password,
                    user.password,
                    (error, result) => {
                        if (!result) {
                            response.status(httpStatus.BAD_REQUEST).json({
                                message:
                                    "The specified user name or password is invalid.",
                            });
                        } else {
                            const identifier = user._id.toString();
                            response.status(httpStatus.CREATED).send({
                                accessToken: createAccessToken(identifier),
                            });
                        }
                    }
                );
            }
        });
    }
});

const postUsersSchema = joi.object({
    userName: joi
        .string()
        .trim()
        .alphanum()
        .lowercase()
        .min(3)
        .max(30)
        .required(),
    firstName: joi.string().trim().required(),
    lastName: joi.string().trim().required(),
    emailAddress: joi.string().email().required(),
    password: joi.string().min(8).max(128).required(),
});

router.post("/users", (request, response) => {
    const parameters = {
        userName: request.body.userName,
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        emailAddress: request.body.emailAddress,
        password: request.body.password,
    };
    const { error, inputUser } = postUsersSchema.validate(parameters);

    if (error) {
        throw error;
    } else {
        User.findOne({ userName: inputUser.userName }).exec((error, user) => {
            if (error) {
                throw error;
            }

            if (user) {
                response.status(httpStatus.BAD_REQUEST).json({
                    message:
                        "A user with the specified user name already exists.",
                });
            } else {
                bcrypt.hash(
                    inputUser.password,
                    SALT_ROUNDS,
                    (error, hashedPassword) => {
                        inputUser.password = hashedPassword;
                        inputUser.role = "REGULAR_USER";
                        const newUser = new User(inputUser);
                        newUser.save((error) => {
                            if (error) {
                                throw error;
                            }

                            const identifier = newUser._id.toString();
                            response.status(httpStatus.CREATED).send({
                                accessToken: createAccessToken(identifier),
                            });
                        });
                    }
                );
            }
        });
    }
});

module.exports = router;
