const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        minlength: 3,
        maxlength: 40,
        required: true,
        unique: false,
        trim: true,
        type: String,
    },
    lastName: {
        minlength: 3,
        maxlength: 40,
        required: true,
        unique: false,
        trim: true,
        type: String,
    },
    emailAddress: {
        lowercase: true,
        maxlength: 255,
        required: true,
        unique: true,
        trim: true,
        type: String,
    },
    password: {
        required: true,
        type: String,
    },
    role: {
        required: true,
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
