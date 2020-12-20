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
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Invoice = require("../model/invoice");
const Account = require("../model/account");
const redisClient = require("./redis");

const { Types } = mongoose;

function toExternalItem(item) {
    return {
        referenceId: item.referenceId,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        subtotal: item.subtotal,
        total: item.total,
    };
}

function toExternal(invoice) {
    const { account } = invoice;
    const result = {
        id: invoice.id,
        ownerId: invoice.ownerId,
        accountId: invoice.accountId,
        subscriptionId: invoice.subscriptionId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        subtotal: invoice.subtotal,
        total: invoice.total,
        origin: invoice.origin,
        notes: invoice.notes,
        termsAndConditions: invoice.termsAndConditions,
        items: invoice.items.map(toExternalItem),
        createdAt: invoice.createdAt,
        dueAt: invoice.dueAt,
        closedAt: invoice.closedAt,
        updatedAt: invoice.updatedAt,
    };

    if (account) {
        result.account = {
            id: account.id,
            userName: account.userName,
            firstName: account.firstName,
            lastName: account.lastName,
            emailAddress: account.emailAddress,
            phoneNumber: account.phoneNumber,
            addressLine1: account.addressLine1,
            addressLine2: account.addressLine2,
            city: account.city,
            state: account.state,
            country: account.country,
            zipCode: account.zipCode,
            createdAt: account.createdAt,
        };
    }

    return result;
}

const invoiceSchema = joi.object({
    notes: joi.string().max(200).allow(null).empty("").default(null),
    termsAndConditions: joi
        .string()
        .max(200)
        .allow(null)
        .empty("")
        .default(null),
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
    search: joi.string().trim().allow(null).empty("").default(null),
});

// NOTE: Input is not sanitized to prevent XSS attacks.
function attachRoutes(router) {
    router.get("/invoices", async (request, response) => {
        const query = request.query;
        const parameters = {
            page: query.page,
            limit: query.limit,
            dateRange: query.date_range,
            startDate: query.start_date,
            endDate: query.end_date,
            search: query.search,
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

        if (value.search) {
            const regex = new RegExp(misc.escapeRegex(value.search), "i");
            filters.$or = [{ invoiceNumber: regex }];
        }

        const invoices = await Invoice.paginate(filters, {
            limit: value.limit,
            page: value.page + 1,
            lean: true,
            leanWithId: true,
            pagination: true,
        });

        const accountIds = [];
        invoices.docs.forEach((invoice) => {
            accountIds.push(invoice.accountId);
        });
        const accounts = await Account.find({
            _id: { $in: accountIds },
        }).exec();
        const accountById = {};
        accounts.forEach((account) => (accountById[account.id] = account));
        invoices.docs.forEach((invoice) => {
            invoice.account = accountById[invoice.accountId];
        });

        const result = {
            totalRecords: invoices.totalDocs,
            page: value.page,
            limit: invoices.limit,
            totalPages: invoices.totalPages,
            previousPage: invoices.prevPage ? invoices.prevPage - 1 : null,
            nextPage: invoices.nextPage ? invoices.nextPage - 1 : null,
            hasPreviousPage: invoices.hasPrevPage,
            hasNextPage: invoices.hasNextPage,
        };
        result.records = invoices.docs.map(toExternal);
        response.status(httpStatus.OK).json(result);
    });

    /* An invoice owned by one user should be hidden from another user. */
    const identifierPattern = /^[a-z0-9]{24}$/;
    router.get("/invoices/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.id)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified invoice identifier is invalid.",
            });
        }

        const ownerId = new Types.ObjectId(request.user.identifier);
        const id = new Types.ObjectId(request.params.id);
        const invoice = await Invoice.findById(id).and([{ ownerId }]).exec();
        if (invoice) {
            response.status(httpStatus.OK).json(toExternal(invoice));
        } else {
            response.status(httpStatus.NOT_FOUND).json({
                message:
                    "Cannot find an invoice with the specified identifier.",
            });
        }
    });

    router.put("/invoices/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.id)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified invoice identifier is invalid.",
            });
        }

        const body = request.body;
        const parameters = {
            notes: body.notes,
            termsAndConditions: body.termsAndConditions,
        };
        const { error, value } = invoiceSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }
        const _id = new Types.ObjectId(request.params.id);
        const ownerId = new Types.ObjectId(request.user.identifier);

        const invoice = await Invoice.findOneAndUpdate(
            { _id, ownerId },
            value,
            { new: true }
        ).exec();
        if (invoice) {
            return response.status(httpStatus.OK).json(toExternal(invoice));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message: "Cannot find an invoice with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
