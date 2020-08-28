const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const authentication = require("./controller/authentication");
const accounts = require("./controller/accounts");
const plans = require("./controller/plans");
const subscriptions = require("./controller/subscriptions");
const transactions = require("./controller/transactions");
const jwtCheck = require("./middleware/jwtCheck");
const unless = require("./middleware/unless");
const requireRole = require("./middleware/requireRole");
const httpStatus = require("./util/httpStatus");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());

function openAccess(request) {
    return (
        (request.url === "/users" && request.method === "POST") ||
        (request.url === "/sessions" && request.method === "POST")
    );
}

const router = express.Router();
router.use("/", unless(openAccess, jwtCheck));
router.use("/", unless(openAccess, requireRole("REGULAR_USER")));
app.use(router);
authentication.attachRoutes(router);
accounts.attachRoutes(router);
plans.attachRoutes(router);
subscriptions.attachRoutes(router);
transactions.attachRoutes(router);

app.use((error, request, response, next) => {
    response.status(httpStatus.INTERNAL_SERVER_ERROR);
    response.send(
        JSON.stringify({
            message:
                "An internal error occurred. Please try again in a few minutes.",
        })
    );
    console.log(error);
});

module.exports = app;
