const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const router = require("./controller/authentication");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());
app.use(router);

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
