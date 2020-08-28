const mongoose = require("mongoose");
const joi = require("joi");
const httpStatus = require("../util/httpStatus");
const Transaction = require("../model/transaction");

const { Types } = mongoose;

function toExternal(transaction) {
    return {
        id: transaction.id,
        ownerId: transaction.ownerId,
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
    comments: joi.string().max(200).default(""),
    action: joi.string().valid("purchase", "refund", "verify").required(),
    referenceId: joi.string().length(24).required(),
    paymentMethod: joi
        .string()
        .valid("cash", "credit_card", "debit_card", "online")
        .required(),
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

        const newTransaction = new Transaction(value);
        newTransaction.ownerId = new Types.ObjectId(request.user.identifier);
        await newTransaction.save();

        response.status(httpStatus.CREATED).json(toExternal(newTransaction));
    });
}

module.exports = {
    attachRoutes,
};
