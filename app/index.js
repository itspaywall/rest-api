const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authentication = require("./controller/authentication");
const accounts = require("./controller/accounts");
const jwtCheck = require("./middleware/jwtCheck");
const unless = require("./middleware/unless");
const requireRole = require("./middleware/requireRole");

require("dotenv").config();
const port = process.env.PORT || 3001;

mongoose.connect("mongodb://localhost/hubble_subscriptions", {
    useNewUrlParser: true,
});
mongoose.connection.on("error", console.error.bind(console, "[error] "));
mongoose.connection.once("open", function () {
    console.log("Database connection successfully established.");
    app.listen(port, function () {
        console.log("You can access the server at http://localhost:" + port);
    });
});

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
