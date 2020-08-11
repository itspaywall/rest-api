const mongoose = require("mongoose");
const User = require("./User");

describe("User model", () => {
    beforeAll(() =>
        mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useCreateIndex: true,
        })
    );
    afterAll(() => mongoose.connection.close());

    it("should create and save a valid user", async () => {
        const validUser = {
            userName: "samuel",
            firstName: "Samuel",
            lastName: "Rowe",
            emailAddress: "samuel@hubblesuite.com",
            password: "12345",
            role: "REGULAR_USER",
        };
        const user = new User(validUser);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.userName).toBe(validUser.userName);
        expect(savedUser.firstName).toBe(validUser.firstName);
        expect(savedUser.lastName).toBe(validUser.lastName);
        expect(savedUser.emailAddress).toBe(validUser.emailAddress);
        expect(savedUser.password).toBe(validUser.password);
        expect(savedUser.role).toBe(validUser.role);
    });

    it("should ignore fields that are not in the schema", async () => {
        const invalidUser = {
            userName: "anushka",
            firstName: "Anushka",
            lastName: "Madyanam",
            emailAddress: "anushka@hubblesuite.com",
            password: "12345",
            role: "REGULAR_USER",
            favoriteFood: "Pizza",
        };
        const user = new User(invalidUser);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.userName).toBe(invalidUser.userName);
        expect(savedUser.firstName).toBe(invalidUser.firstName);
        expect(savedUser.lastName).toBe(invalidUser.lastName);
        expect(savedUser.emailAddress).toBe(invalidUser.emailAddress);
        expect(savedUser.password).toBe(invalidUser.password);
        expect(savedUser.role).toBe(invalidUser.role);
        expect(savedUser.favoriteFood).toBeUndefined();
    });

    it("should fail when a required field is missing", async () => {
        const invalidUser = {
            firstName: "Samuel",
            lastName: "Rowe",
            emailAddress: "samuel@hubblesuite.com",
            password: "12345",
            role: "REGULAR_USER",
        };
        const user = new User(invalidUser);
        let error;
        try {
            await user.save();
        } catch (error0) {
            error = error0;
        }
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});
