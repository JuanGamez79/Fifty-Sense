const mongoose = require('mongoose');

// Settings info should be saved in Users if required

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    date_created: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
module.exports = User;