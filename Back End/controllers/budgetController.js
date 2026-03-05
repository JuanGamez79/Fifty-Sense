const Budget = require('../models/Budgets');

const BudgetController = {
    create: async (req, res) => {
        try {
            const newBudget = await Budget.create(req.body);
            res.status(201).send(newBudget);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedBudget = await Budget.findByIdAndDelete(id);
            
            if (!deletedBudget) {
                return res.status(404).json({ message: "Budget not found" });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

}

export default BudgetController;