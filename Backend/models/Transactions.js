const mongoose = require('mongoose');
const crypto = require('crypto');


const transactionSchema = new mongoose.Schema({
    transaction_id: { type: String, default: () => crypto.randomUUID(), required: true },
    account_id: { type: String, required: true },
    category_id: { type: String, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    is_active: { type: Boolean, default: true }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;