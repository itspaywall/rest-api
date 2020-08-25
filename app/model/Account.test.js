const mongoose = require("mongoose");
const Account = require("./Account");

describe("Account model", () => {
    beforeAll(() =>
        mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useCreateIndex: true,
        })
    );
    afterAll(() => mongoose.connection.close());

    it("should create and save a valid account", async () => {
        const validAccount = {
            ownerId: new mongoose.Types.ObjectId(),
            userName: "Test",
            firstName: "John",
            lastName: "Doe",
            company: "Company",
            emailAddress: "contact@company.com",
            phoneNumber: "+91 9999999999",
            addressLine1: "This is a sample address line.",
            addressLine2: "This is a sample address line.",
            city: "London",
            state: "London",
            country: "United Kingdom",
            zipCode: "555555",
            createdAt: new Date(),
            deleted: false,
        };
        const account = new Account(validAccount);
        const savedAccount = await account.save();

        expect(savedAccount._id).toBeDefined();
        expect(savedAccount.userName).toBe(validAccount.userName);
        expect(savedAccount.firstName).toBe(validAccount.firstName);
        expect(savedAccount.lastName).toBe(validAccount.lastName);
        expect(savedAccount.company).toBe(validAccount.company);
        expect(savedAccount.emailAddress).toBe(validAccount.emailAddress);
        expect(savedAccount.phoneNumber).toBe(validAccount.phoneNumber);
        expect(savedAccount.addressLine1).toBe(validAccount.addressLine1);
        expect(savedAccount.addressLine2).toBe(validAccount.addressLine2);
        expect(savedAccount.city).toBe(validAccount.city);
        expect(savedAccount.state).toBe(validAccount.state);
        expect(savedAccount.country).toBe(validAccount.country);
        expect(savedAccount.zipCode).toBe(validAccount.zipCode);
        expect(savedAccount.createdAt).toEqual(validAccount.createdAt);
        expect(savedAccount.deleted).toBe(validAccount.deleted);
    });

    it("should ignore fields that are not in the schema", async () => {
        const invalidAccount = {
            ownerId: new mongoose.Types.ObjectId(),
            userName: "Test",
            firstName: "John",
            lastName: "Doe",
            company: "Company",
            emailAddress: "contact@company.com",
            phoneNumber: "+91 9999999999",
            addressLine1: "This is a sample address line.",
            addressLine2: "This is a sample address line.",
            city: "London",
            state: "London",
            country: "United Kingdom",
            zipCode: "555555",
            createdAt: new Date(),
            deleted: false,
            favoriteFood: "Pizza",
        };
        const account = new Account(invalidAccount);
        const savedAccount = await account.save();

        expect(savedAccount._id).toBeDefined();
        expect(savedAccount.userName).toBe(invalidAccount.userName);
        expect(savedAccount.firstName).toBe(invalidAccount.firstName);
        expect(savedAccount.lastName).toBe(invalidAccount.lastName);
        expect(savedAccount.company).toBe(invalidAccount.company);
        expect(savedAccount.emailAddress).toBe(invalidAccount.emailAddress);
        expect(savedAccount.phoneNumber).toBe(invalidAccount.phoneNumber);
        expect(savedAccount.addressLine1).toBe(invalidAccount.addressLine1);
        expect(savedAccount.addressLine2).toBe(invalidAccount.addressLine2);
        expect(savedAccount.city).toBe(invalidAccount.city);
        expect(savedAccount.state).toBe(invalidAccount.state);
        expect(savedAccount.country).toBe(invalidAccount.country);
        expect(savedAccount.zipCode).toBe(invalidAccount.zipCode);
        expect(savedAccount.createdAt).toEqual(invalidAccount.createdAt);
        expect(savedAccount.deleted).toBe(invalidAccount.deleted);
        expect(savedAccount.favoriteFood).toBeUndefined();
    });

    it("should fail when a required field is missing", async () => {
        const invalidAccount = {
            userName: "Test",
            firstName: "John",
            lastName: "Doe",
            company: "Company",
            emailAddress: "contact@company.com",
            phoneNumber: "+91 9999999999",
            addressLine1: "This is a sample address line.",
            addressLine2: "This is a sample address line.",
            city: "London",
            state: "London",
            country: "United Kingdom",
            zipCode: "555555",
            createdAt: new Date(),
            deleted: false,
        };
        const account = new Account(invalidAccount);
        let error;
        try {
            await account.save();
        } catch (error0) {
            error = error0;
        }
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});
