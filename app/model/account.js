const mongoose = require("mongoose");
const paginate = require("../util/paginate");

const { Schema } = mongoose;

const accountSchema = new Schema({
    ownerId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    subscriptionIds: {
        required: true,
        type: [Schema.Types.ObjectId],
    },
    userName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    firstName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    lastName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    /*company: {
        type: String,
    },*/
    emailAddress: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    addressLine1: {
        type: String,
    },
    addressLine2: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    zipCode: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

accountSchema.index({
    userName: "text",
    firstName: "text",
    lastName: "text",
});
accountSchema.plugin(paginate);
const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
