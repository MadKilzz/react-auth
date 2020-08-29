
const mongoose = require('mongoose');

// Schema
const users = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    username: String,
    email: String,
    password: String,
    token: String,
    is_moderator: Boolean,
    created_at: Date,
    updated_at: Date
});

// Module Exports
module.exports = mongoose.model("react-auth", users, "users");
