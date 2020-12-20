/*
 * Copyright 2017-2020 Samuel Rowe, Joel E. Rego
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const mongoose = require("mongoose");
const app = require("./app");
const https = require("https");
const http = require("http");
const fs = require("fs");

const port = process.env.SERVER_PORT;
const databaseUrl = process.env.DATABASE_URL;

/* Start a HTTPS server only at production. */
let createServer = http.createServer;
let options = {};
if (process.env.TARGET === "deploy") {
    createServer = https.createServer;
    options.key = fs.readFileSync(process.env.SSL_PRIVATE_KEY_PATH);
    options.cert = fs.readFileSync(process.env.SSL_CERTIFICATE_PATH);
    options.ca = fs.readFileSync(process.env.SSL_CHAIN_PATH);
}

mongoose.connect(databaseUrl, {
    useNewUrlParser: true,
});
mongoose.connection.on("error", console.error.bind(console, "[error] "));
mongoose.connection.once("open", () => {
    console.log("Database connection successfully established.");
    createServer(options, app).listen(port, () => {
        console.log("You can access the server at http://localhost:" + port);
    });
});
