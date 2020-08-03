const express = require("express");
const User = require("../model/User");
const httpStatus = require("..//util/httpStatus");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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

router.post("/sessions", (request, response) => {
    const { userName, password } = request.body;

    if (!userName || !password) {
        return response.status(httpStatus.BAD_REQUEST).json({
            message: "The specified user name or password is invalid.",
        });
    }

    User.findOne({ userName }).exec((error, user) => {
        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified user name or password is invalid.",
            });
        }

        bcrypt.compare(
            request.body.password,
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
    });
});

function validate(response, specification, parameters) {
    return specification.every((item) => {
        let result = true;
        if (!parameters[item.identifier]) {
            response.status(httpStatus.BAD_REQUEST).json({
                message: `Please specifiy a valid ${item.title}.`,
            });
            result = false;
        }
        return result;
    });
}

const specification = [
    {
        identifier: "userName",
        title: "user name",
    },
    {
        identifier: "firstName",
        title: "first name",
    },
    {
        identifier: "emailAddress",
        title: "email address",
    },
    {
        identifier: "password",
        title: "password",
    },
];

router.post("/users", (request, response) => {
    if (validate(response, specification, request.body)) {
        const {
            userName,
            firstName,
            lastName,
            emailAddress,
            password,
        } = request.body;
        User.findOne({ userName }).exec((error, user) => {
            if (error) {
                throw error;
            }

            if (user) {
                response.status(httpStatus.BAD_REQUEST).json({
                    message:
                        "A user with the specified user name already exists.",
                });
            } else {
                bcrypt.hash(password, SALT_ROUNDS, (error, hashedPassword) => {
                    const role = "REGULAR_USER";
                    const newUser = new User({
                        userName,
                        firstName,
                        lastName,
                        emailAddress,
                        password: hashedPassword,
                        role,
                    });
                    newUser.save((error) => {
                        if (error) {
                            throw error;
                        }

                        const identifier = newUser._id.toString();
                        response.status(httpStatus.CREATED).send({
                            accessToken: createAccessToken(identifier),
                        });
                    });
                });
            }
        });
    }
});

module.exports = router;
