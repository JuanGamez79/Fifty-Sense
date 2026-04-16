const mongoose = require('mongoose');


const accountSchema = new mongoose.Schema({
    account_id: { type: String, default: () => crypto.randomUUID(), required: true },
    user_id: { type: String, required: true },
    account_name: { type: String, required: true },
    balance: { type: Number },
    is_active: { type: Boolean, default: true }
});

const Accounts = mongoose.model("Accounts", accountSchema);
module.exports = Accounts;