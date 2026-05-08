const Budget = require('../models/Budgets');
const { randomUUID } = require('crypto');

const BudgetController = {
  create: async (req, res) => {
    try {
      const { user_id, category_name, limit_amount, period } = req.body;
      const newBudget = await Budget.create({
        budget_id: randomUUID(),
        user_id,
        category_name,
        limit_amount: Number(limit_amount),
        period: period || 'monthly',
      });
      res.status(201).json(newBudget);
    } catch (error) {
      res.status(500).json({ message: 'Error creating budget', error: error.message });
    }
  },

  getByUser: async (req, res) => {
    try {
      const budgets = await Budget.find({ user_id: req.params.user_id });
      res.status(200).json(budgets);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching budgets', error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await Budget.findOneAndDelete({ budget_id: req.params.budget_id });
      if (!deleted) return res.status(404).json({ message: 'Budget not found' });
      res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting budget', error: error.message });
    }
  },
};

module.exports = BudgetController;