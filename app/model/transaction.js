const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const transactionSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    comments: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        enum: ["purchase", "refund", "verify"],
        required: true,
    },
    /* Action   | Reference
     * ----------------------
     * purchase | invoice
     * refund   | transaction
     * verify   | subscription
     */
    referenceId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "credit_card", "debit_card", "online"],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

transactionSchema.plugin(paginate);
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
