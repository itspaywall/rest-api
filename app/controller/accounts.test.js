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

        app.listen(3001);

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
