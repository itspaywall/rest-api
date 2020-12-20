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
const Plan = require("./plan");

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
            pricePerBillingCycle: 1000.5,
            setupFee: 500,
            trialPeriod: 14,
            trialPeriodUnit: "days",
            term: 24,
            termUnit: "months",
            renews: true,
            createdAt: new Date(),
        };
        const plan = new Plan(validPlan);
        const savedPlan = await plan.save();

        expect(savedPlan._id).toBeDefined();
        expect(savedPlan.name).toBe(validPlan.name);
        expect(savedPlan.code).toBe(validPlan.code);
        expect(savedPlan.description).toBe(validPlan.description);
        expect(savedPlan.billingPeriod).toBe(validPlan.billingPeriod);
        expect(savedPlan.billingPeriodUnit).toBe(validPlan.billingPeriodUnit);
        expect(savedPlan.pricePerBillingCycle).toBe(
            validPlan.pricePerBillingCycle
        );
        expect(savedPlan.setupFee).toBe(validPlan.setupFee);
        expect(savedPlan.trialPeriod).toBe(validPlan.trialPeriod);
        expect(savedPlan.trialPeriodUnit).toBe(validPlan.trialPeriodUnit);
        expect(savedPlan.term).toBe(validPlan.term);
        expect(savedPlan.termUnit).toBe(validPlan.termUnit);
        expect(savedPlan.renews).toBe(validPlan.renews);
        expect(savedPlan.createdAt).toEqual(validPlan.createdAt);
    });

    it("should ignore fields that are not in the schema", async () => {
        const invalidPlan = {
            ownerId: new mongoose.Types.ObjectId(),
            name: "Test",
            code: "test",
            description: "This is a sample plan.",
            billingPeriod: 12,
            billingPeriodUnit: "months",
            pricePerBillingCycle: 1000.5,
            setupFee: 500,
            trialPeriod: 14,
            trialPeriodUnit: "days",
            term: 24,
            termUnit: "months",
            renews: true,
            createdAt: new Date(),
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
        expect(savedPlan.pricePerBillingCycle).toBe(
            invalidPlan.pricePerBillingCycle
        );
        expect(savedPlan.setupFee).toBe(invalidPlan.setupFee);
        expect(savedPlan.trialPeriod).toBe(invalidPlan.trialPeriod);
        expect(savedPlan.trialPeriodUnit).toBe(invalidPlan.trialPeriodUnit);
        expect(savedPlan.term).toBe(invalidPlan.term);
        expect(savedPlan.termUnit).toBe(invalidPlan.termUnit);
        expect(savedPlan.renews).toBe(invalidPlan.renews);
        expect(savedPlan.createdAt).toEqual(invalidPlan.createdAt);
        expect(savedPlan.favoriteFood).toBeUndefined();
    });

    it("should fail when a required field is missing", async () => {
        const invalidPlan = {
            name: "Test",
            code: "test",
            description: "This is a sample plan.",
            billingPeriod: 12,
            billingPeriodUnit: "months",
            pricePerBillingCycle: 1000.5,
            setupFee: 500,
            trialPeriod: 14,
            trialPeriodUnit: "days",
            term: 24,
            termUnit: "months",
            renews: true,
            createdAt: new Date(),
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
