const mongoose = require("mongoose");
const app = require("./app");

const port = process.env.SERVER_PORT;
const databaseUrl = process.env.DATABASE_URL;

mongoose.connect(databaseUrl, {
    useNewUrlParser: true,
});
mongoose.connection.on("error", console.error.bind(console, "[error] "));
mongoose.connection.once("open", function () {
    console.log("Database connection successfully established.");
    app.listen(port, function () {
        console.log("You can access the server at http://localhost:" + port);
    });
});
