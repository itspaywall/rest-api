var express = require("express");
var logger = require("morgan");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.get("/", function (request, response) {
    response.json({
        message: "Hello, world!",
    });
});
app.listen(3000, function () {
    console.log("Listening on port 3000.");
});
