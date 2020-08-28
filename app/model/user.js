const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        unique: true,
        trim: true,
        type: String,
    },
    firstName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        unique: false,
        trim: true,
        type: String,
    },
    lastName: {
        minlength: 2,
        maxlength: 100,
        required: true,
        unique: false,
        trim: true,
        type: String,
    },
    emailAddress: {
        lowercase: true,
        maxlength: 255,
        minlength: 5,
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
});

const User = mongoose.model("User", userSchema);

module.exports = User;
