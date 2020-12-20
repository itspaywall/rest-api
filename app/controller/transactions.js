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
const joi = require("joi");
const assert = require("assert");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Transaction = require("../model/transaction");
const subMonths = require("date-fns/subMonths");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");

const { Types } = mongoose;

function toExternal(transaction) {
    return {
        id: transaction.id,
        amount: transaction.amount,
        tax: transaction.tax,
        comments: transaction.comments,
        action: transaction.action,
        referenceId: transaction.referenceId,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
    };
}

const transactionSchema = joi.object({
    amount: joi.number().required(),
    tax: joi.number().required(),
    comments: joi.string().max(200).allow(null).empty("").default(null),
    action: joi.string().valid("purchase", "refund", "verify").required(),
    referenceId: joi.string().length(24).required(),
    paymentMethod: joi
        .string()
        .valid("cash", "credit_card", "debit_card", "online")
        .required(),
});

const filterSchema = joi.object({
    page: joi.number().integer().default(0),
    limit: joi
        .number()
        .integer()
        .min(10)
        .max(constants.PAGINATE_MAX_LIMIT)
        .default(20),
    dateRange: joi
        .string()
        .valid(
            "all_time",
            "last_3_months",
            "last_6_months",
            "last_9_months",
            "last_12_months",
            "last_15_months",
            "last_18_months",
            "custom"
        )
        .default("all_time"),
    startDate: joi
        .date()
        .when("date_range", { is: "custom", then: joi.required() }),
    endDate: joi
        .date()
        .when("date_range", { is: "custom", then: joi.required() }),
});

// NOTE: Input is not sanitized to prevent XSS attacks.
// TODO: Should we check if there is a transaction already attached to the specified reference id?
// And ensure that the reference id is owned by the user.
function attachRoutes(router) {
    router.post("/transactions", async (request, response) => {
        const body = request.body;
        const parameters = {
            amount: body.amount,
            tax: body.tax,
            comments: body.comments,
            action: body.action,
            referenceId: body.referenceId,
            paymentMethod: body.paymentMethod,
        };
        const { error, value } = transactionSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        value.ownerId = new Types.ObjectId(request.user.identifier);
        const newTransaction = new Transaction(value);
        await newTransaction.save();
        response.status(httpStatus.CREATED).json(toExternal(newTransaction));
    });

    router.get("/transactions", async (request, response) => {
        const query = request.query;
        const parameters = {
            page: query.page,
            limit: query.limit,
            dateRange: query.date_range,
            startDate: query.start_date,
            endDate: query.end_date,
        };

        const { error, value } = filterSchema.validate(parameters);
        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        let startDate = value.startDate;
        let endDate = value.endDate;
        const dateRange = value.dateRange;
        if (dateRange !== "custom" && dateRange !== "all_time") {
            const months = {
                last_3_months: 3,
                last_6_months: 6,
                last_9_months: 9,
                last_12_months: 12,
                last_15_months: 15,
                last_18_months: 18,
            };
            const amount = months[dateRange];
            assert(
                amount,
                "The specified date range is invalid. How did Joi let it through?"
            );
            startDate = subMonths(new Date(), amount);
            endDate = new Date();
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const filters = {
            ownerId,
        };
        if (dateRange !== "all_time") {
            filters.createdAt = {
                $gte: startOfDay(startDate),
                $lte: endOfDay(endDate),
            };
        }

        const transactions = await Transaction.paginate(filters, {
            limit: value.limit,
            page: value.page + 1,
            lean: true,
            leanWithId: true,
            pagination: true,
        });

        const result = {
            totalRecords: transactions.totalDocs,
            page: value.page,
            limit: transactions.limit,
            totalPages: transactions.totalPages,
            previousPage: transactions.prevPage
                ? transactions.prevPage - 1
                : null,
            nextPage: transactions.nextPage ? transactions.nextPage - 1 : null,
            hasPreviousPage: transactions.hasPrevPage,
            hasNextPage: transactions.hasNextPage,
        };
        result.records = transactions.docs.map(toExternal);
        response.status(httpStatus.OK).json(result);
    });

    const identifierPattern = /^[a-z0-9]{24}$/;
    /* A transaction created by one user should be hidden from another user. */
    router.get("/transactions/:identifier", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified transaction identifier is invalid.",
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.identifier);
        const transaction = await Transaction.findById(id)
            .and([{ ownerId }])
            .exec();
        if (transaction) {
            return response.status(httpStatus.OK).json(toExternal(transaction));
        }
        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find a transaction with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
