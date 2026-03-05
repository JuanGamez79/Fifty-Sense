import { Schema, model } from 'mongoose';


const budgetSchema = new Schema({
    budget_id: { type: String, required: true },
    category_id: { type: String, required: true },
    budget_name: { type: String, required: true },
    current_amount: { type: Number, required: true },
    amount_remaining: { type: Number, required: true },
    date_created: { type: Date, default: Date.now }
});

export default model('Budgets', budgetSchema);