const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const authentication = require("./controller/authentication");
const accounts = require("./controller/accounts");
const plans = require("./controller/plans");
const jwtCheck = require("./middleware/jwtCheck");
const unless = require("./middleware/unless");
const requireRole = require("./middleware/requireRole");

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

module.exports = app;
