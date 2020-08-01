const express = require("express");
const configuration = require("../configuration");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

const app = express.Router();

// TODO: Move this to MongoDB.
var users = [
    {
        id: 1,
        userName: "user",
        password: "12345",
        emailAddress: "user@example.com",
    },
];

const JWT_LIFE_TIME = "7d";

function createAccessToken(user) {
    return jwt.sign(user, configuration.secret, {
        issuer: configuration.issuer,
        audience: configuration.audience,
        expiresIn: JWT_LIFE_TIME,
        algorithm: "HS256",
    });
}

app.post("/users", function (request, response) {
    const { userName, emailAddress, password } = request.body;

    if (!userName || !emailAddress || !password) {
        return response
            .status(400)
            .send(
                "Please specifiy valid user name, email address and password."
            );
    }

    const user = users.find((item) => item.userName === userName);
    if (user) {
        return response
            .status(400)
            .send("A user with the specified user name already exists.");
    }

    const identifier = users.length + 1;
    const role = "REGULAR_USER";
    const newUser = {
        userName,
        emailAddress,
        password,
        identifier,
        role,
    };
    users.push(newUser);

    response.status(201).send({
        accessToken: createAccessToken(newUser),
    });
});

app.post("/sessions/create", function (request, response) {
    const { userName, password } = request.body;

    if (!userName || !password) {
        return response.status(400).json({
            message: "The specified user name or password is invalid.",
        });
    }

    const user = users.find((item) => item.userName === userName);
    if (!user) {
        return response.status(401).json({
            message: "The specified user name or password is invalid.",
        });
    }

    if (user.password !== request.body.password) {
        return response.status(401).json({
            message: "The specified user name or password is invalid.",
        });
    }

    response.status(201).send({
        accessToken: createAccessToken(user),
    });
});

const jwtCheck = expressJwt({
    secret: configuration.secret,
    audience: configuration.audience,
    issuer: configuration.issuer,
    algorithms: ["HS256"],
});

function requireRole(role) {
    return (request, response, next) => {
        if (request.user.role !== role) {
            response.sendStatus(401);
        } else {
            next();
        }
    };
}

app.use("/api", jwtCheck, requireRole("REGULAR_USER"));
app.use((error, request, response, next) => {
    if (error.name === "UnauthorizedError") {
        response.status(401).json({
            message: "Unauthorized access",
        });
    }
});

app.get("/api/hello", function (request, response) {
    response.status(200).json({
        message: "Hello, world!",
    });
});

module.exports = app;
