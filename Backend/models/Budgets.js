const mongoose = require('mongoose');


const budgetSchema = new mongoose.Schema({
    budget_id: { type: String, required: true },
    category_id: { type: String, required: true },
    budgeted_amount: { type: Number, required: true }, // The Upper Limit of the Budget
    amount_spent: { type: Number, required: true }, // (Spent $350 of $500)
    date_created: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
});

const Budgets = mongoose.model("Budgets", budgetSchema);
module.exports = Budgets;