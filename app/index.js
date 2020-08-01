const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const authentication = require("./authentication");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());
app.use(authentication);

require("dotenv").config();
const port = process.env.PORT || 3001;

app.listen(port, function () {
    console.log("You can access the server at http://localhost:" + port);
});
