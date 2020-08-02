const express = require("express");
const User = require("../model/User");
const httpStatus = require("..//util/httpStatus");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const bcrypt = require("bcrypt");
const configuration = require("../../configuration");

const JWT_LIFE_TIME = "7d";
const SALT_ROUNDS = 10;

function createAccessToken(identifier) {
    return jwt.sign({ identifier }, configuration.secret, {
        issuer: configuration.issuer,
        audience: configuration.audience,
        expiresIn: JWT_LIFE_TIME,
        algorithm: "HS256",
    });
}

const jwtCheck = expressJwt({
    secret: configuration.secret,
    audience: configuration.audience,
    issuer: configuration.issuer,
    algorithms: ["HS256"],
}).unless({
    path: [
        {
            url: "/users",
            methods: ["POST"],
        },
        {
            url: "/sessions",
            methods: ["POST"],
        },
    ],
});

function requireRole(role) {
    return (request, response, next) => {
        if (
            request.url !== "/users" &&
            request.url !== "/sessions" &&
            request.method != "POST"
        ) {
            const identifier = request.user;
            User.findById(identifier, (error, user) => {
                if (error) {
                    throw error;
                }
                if (user.role !== role) {
                    response.status(httpStatus.FORBIDDEN).json({
                        message: "The requested resource is forbidden.",
                    });
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    };
}

const router = express.Router();

router.use("/", jwtCheck);
router.use("/", requireRole("REGULAR_USER"));

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
