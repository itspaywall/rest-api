const mongoose = require("mongoose");
const joi = require("joi");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Invoice = require("../model/Invoice");

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
    page: joi.number().integer().default(1),
    limit: joi
        .number()
        .integer()
        .min(10)
        .max(constants.PAGINATE_MAX_LIMIT)
        .default(10),
});

// NOTE: Input is not sanitized to prevent XSS attacks.
function attachRoutes(router) {
    router.get("/invoices", async (request, response) => {
        const body = request.body;
        const parameters = {
            page: body.page,
            limit: body.limit,
        };
        const { error, value } = filterSchema.validate(parameters);
        if (error) {
            response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        } else {
            const ownerId = new Types.ObjectId(request.user.identifier);
            const invoices = await Invoice.paginate(
                { ownerId },
                {
                    limit: value.limit,
                    page: value,
                    lean: true,
                    leanWithId: true,
                    pagination: true,
                }
            );
            response.status(httpStatus.OK).json(invoices.docs.map(toExternal));
        }
    });

    /* An invoice owned by one user should be hidden from another user. */
    router.get("/invoices/:id", async (request, response) => {
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
