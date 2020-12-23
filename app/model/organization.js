const mongoose = require("mongoose");

const { Schema } = mongoose;

const organizationSchema = new Schema({
    id: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    name: {
        minlength: 2,
        maxlength: 100,
        required: true,
        trim: true,
        type: String,
    },
    emailAddress: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    gstin: {
        minlength: 15,
        maxlength: 15,
        required: true,
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
    website: {
        type: String,
    },
    industry: {
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

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
