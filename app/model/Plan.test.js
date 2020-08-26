const mongoose = require("mongoose");
const Plan = require("./Plan");

describe("Plan model", () => {
    beforeAll(() =>
        mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useCreateIndex: true,
        })
    );
    afterAll(() => mongoose.connection.close());

    it("should create and save a valid plan", async () => {
        const validPlan = {
            ownerId: new mongoose.Types.ObjectId(),
            name: "Test",
            code: "test",
            description: "This is a sample plan.",
            billingPeriod: 12,
            billingPeriodUnit: "months",
            pricePerBillingPeriod: 1000.5,
            setupFee: 500,
            trialPeriod: 14,
            trialPeriodUnit: "days",
            term: 24,
            termUnit: "months",
            renews: true,
            createdAt: new Date(),
            deleted: false,
        };
        const plan = new Plan(validPlan);
        const savedPlan = await plan.save();

        expect(savedPlan._id).toBeDefined();
        expect(savedPlan.name).toBe(validPlan.name);
        expect(savedPlan.code).toBe(validPlan.code);
        expect(savedPlan.description).toBe(validPlan.description);
        expect(savedPlan.billingPeriod).toBe(validPlan.billingPeriod);
        expect(savedPlan.billingPeriodUnit).toBe(validPlan.billingPeriodUnit);
        expect(savedPlan.pricePerBillingPeriod).toBe(
            validPlan.pricePerBillingPeriod
        );
        expect(savedPlan.setupFee).toBe(validPlan.setupFee);
        expect(savedPlan.trialPeriod).toBe(validPlan.trialPeriod);
        expect(savedPlan.trialPeriodUnit).toBe(validPlan.trialPeriodUnit);
        expect(savedPlan.term).toBe(validPlan.term);
        expect(savedPlan.termUnit).toBe(validPlan.termUnit);
        expect(savedPlan.renews).toBe(validPlan.renews);
        expect(savedPlan.createdAt).toEqual(validPlan.createdAt);
        expect(savedPlan.deleted).toBe(validPlan.deleted);
    });

    it("should ignore fields that are not in the schema", async () => {
        const invalidPlan = {
            ownerId: new mongoose.Types.ObjectId(),
            name: "Test",
            code: "test",
            description: "This is a sample plan.",
            billingPeriod: 12,
            billingPeriodUnit: "months",
            pricePerBillingPeriod: 1000.5,
            setupFee: 500,
            trialPeriod: 14,
            trialPeriodUnit: "days",
            term: 24,
            termUnit: "months",
            renews: true,
            createdAt: new Date(),
            deleted: false,
            favoriteFood: "Pizza",
        };
        const plan = new Plan(invalidPlan);
        const savedPlan = await plan.save();

        expect(savedPlan._id).toBeDefined();
        expect(savedPlan.name).toBe(invalidPlan.name);
        expect(savedPlan.code).toBe(invalidPlan.code);
        expect(savedPlan.description).toBe(invalidPlan.description);
        expect(savedPlan.billingPeriod).toBe(invalidPlan.billingPeriod);
        expect(savedPlan.billingPeriodUnit).toBe(invalidPlan.billingPeriodUnit);
        expect(savedPlan.pricePerBillingPeriod).toBe(
            invalidPlan.pricePerBillingPeriod
        );
        expect(savedPlan.setupFee).toBe(invalidPlan.setupFee);
        expect(savedPlan.trialPeriod).toBe(invalidPlan.trialPeriod);
        expect(savedPlan.trialPeriodUnit).toBe(invalidPlan.trialPeriodUnit);
        expect(savedPlan.term).toBe(invalidPlan.term);
        expect(savedPlan.termUnit).toBe(invalidPlan.termUnit);
        expect(savedPlan.renews).toBe(invalidPlan.renews);
        expect(savedPlan.createdAt).toEqual(invalidPlan.createdAt);
        expect(savedPlan.deleted).toBe(invalidPlan.deleted);
        expect(savedPlan.favoriteFood).toBeUndefined();
    });

    it("should fail when a required field is missing", async () => {
        const invalidPlan = {
            name: "Test",
            code: "test",
            description: "This is a sample plan.",
            billingPeriod: 12,
            billingPeriodUnit: "months",
            pricePerBillingPeriod: 1000.5,
            setupFee: 500,
            trialPeriod: 14,
            trialPeriodUnit: "days",
            term: 24,
            termUnit: "months",
            renews: true,
            createdAt: new Date(),
            upadatedAt: new Date(),
            deleted: false,
        };
        const plan = new Plan(invalidPlan);
        let error;
        try {
            await plan.save();
        } catch (error0) {
            error = error0;
        }
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});
