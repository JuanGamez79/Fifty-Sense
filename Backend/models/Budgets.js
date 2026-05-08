const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  budget_id:     { type: String, required: true, unique: true },
  user_id:       { type: String, required: true },
  category_name: { type: String, required: true },
  limit_amount:  { type: Number, required: true },
  period:        { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  date_created:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Budget', budgetSchema);