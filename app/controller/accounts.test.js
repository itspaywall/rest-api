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
const supertest = require("supertest");
const assert = require("assert");
const app = require("../app");
const httpStatus = require("../util/httpStatus");
const constants = require("../util/constants");

const request = supertest(app);

describe("GET /accounts", () => {
    let accessToken;
    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useCreateIndex: true,
        });

        app.listen(5319);

        const user = {
            userName: "joel",
            firstName: "Joel",
            lastName: "Rego",
            emailAddress: "joel@hubblesuite.com",
            password: "12345678",
        };
        const response = await request.post("/users").send(user);
        accessToken = response.body.accessToken;
        assert.ok(accessToken);

        // insert fake data
    });
    afterAll(() => mongoose.connection.close());

    it("should prevent unauthorized access", async () => {
        const response = await request.get("/accounts");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        expect(response.body).toEqual({
            message: "Unauthorized access",
        });
    });

    it("should respond with accounts less than or equal to the maximum limit", async () => {
        const response = await request
            .get("/accounts")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(httpStatus.OK);

        const result = response.body;
        expect(result.length).toBeLessThanOrEqual(constants.PAGINATE_MAX_LIMIT);
    });
});
