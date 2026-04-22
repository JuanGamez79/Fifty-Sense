<<<<<<< Updated upstream
import { Schema, model } from 'mongoose';


const budgetSchema = new Schema({
    budget_id: { type: String, required: true },
=======
const mongoose = require('mongoose');
const crypto = require('crypto');

const budgetSchema = new mongoose.Schema({
    budget_id: { type: String, default: () => crypto.randomUUID(), required: true },
    user_id: { type: String, required: true },
>>>>>>> Stashed changes
    category_id: { type: String, required: true },
    budget_name: { type: String, required: true },
    current_amount: { type: Number, required: true },
    amount_remaining: { type: Number, required: true },
    date_created: { type: Date, default: Date.now }
});

export default model('Budgets', budgetSchema);