const mongoose = require("mongoose");
const joi = require("joi");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Invoice = require("../model/Invoice");
const redisClient = require("./redis");

const { Types } = mongoose;

function toExternalSubscription(subscription) {
    return {
        subscriptionId: subscription.subscriptionId,
        description: subscription.description,
        quantity: subscription.quantity,
        startedAt: subscription.startedAt,
        endedAt: subscription.endedAt,
        subtotal: subscription.subtotal,
        total: subscription.total,
    };
}

function toExternal(invoice) {
    return {
        id: invoice.id,
        ownerId: invoice.ownerId,
        accountId: invoice.accountId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        subtotal: invoice.subtotal,
        total: invoice.total,
        origin: invoice.origin,
        notes: invoice.notes,
        termsAndConditions: invoice.termsAndConditions,
        subscriptions: invoice.subscriptions.map(toExternalSubscription),
        createdAt: invoice.createdAt,
        dueAt: invoice.dueAt,
        closedAt: invoice.closedAt,
    };
}

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
        if (!identifierPattern.test(request.params.identifier)) {
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
}

module.exports = {
    attachRoutes,
};
