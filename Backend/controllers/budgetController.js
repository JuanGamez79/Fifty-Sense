const Budget = require('../models/Budgets');

const BudgetController = {
    create: async (req, res) => {
        try {
            const newBudget = await Budget.create(req.body);
            res.status(201).json(newBudget);
        } catch (error) {
            res.status(500).json({ message: "Error creating budget", error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { budget_id } = req.params;
            const deletedBudget = await Budget.findByIdAndDelete(budget_id);

            if (!deletedBudget) {
                return res.status(404).json({ message: "Budget not found" });
            }
            res.status(200).json({ message: "Budget deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting budget", error: error.message });
        }
    },
};

module.exports = BudgetController;