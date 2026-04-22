const Budget = require('../models/Budgets');

const BudgetController = {
<<<<<<< Updated upstream
    create: catchasync(async (req, res) => {
        const newBudget = await Budget.create(req.body);
        res.status(201).send(newBudget);
    }),

    delete: catchasync(async (req, res) => {
        const { id } = req.params;
        const deletedBudget = await Budget.findByIdAndDelete(id);
        
        if (!deletedBudget) {
            return res.status(404).json({ message: "Budget not found" });
=======
    // GET all budgets for the authenticated user
    getAll: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const budgets = await Budget.find({ user_id, is_active: true });
            res.status(200).json({
                status: 'success',
                data: budgets,
                message: 'Budgets retrieved successfully',
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching budgets', error: error.message });
>>>>>>> Stashed changes
        }
        res.status(204).send();
    }),

<<<<<<< Updated upstream
}

export default BudgetController;
=======
    // POST /create — inject user_id from the JWT, not from req.body
    create: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const { category_id, budget_name, current_amount } = req.body;

            if (!category_id || !budget_name || current_amount === undefined) {
                return res.status(400).json({ message: 'category_id, budget_name, and current_amount are required.' });
            }

            if (typeof current_amount !== 'number' || current_amount < 0) {
                return res.status(400).json({ message: 'current_amount must be a non-negative number.' });
            }

            const newBudget = await Budget.create({
                user_id,
                category_id,
                budget_name,
                current_amount,
                amount_remaining: current_amount,
            });

            res.status(201).json({
                status: 'success',
                data: newBudget,
                message: 'Budget created successfully',
            });
        } catch (error) {
            res.status(500).json({ message: 'Error creating budget', error: error.message });
        }
    },

    // PUT /:budget_id — update budget amount; recalculate amount_remaining
    update: async (req, res) => {
        try {
            const { budget_id } = req.params;
            const user_id = req.user.user_id;
            const { budget_name, current_amount } = req.body;

            const budget = await Budget.findOne({ budget_id, user_id });
            if (!budget) {
                return res.status(404).json({ message: 'Budget not found.' });
            }

            if (budget_name !== undefined) budget.budget_name = budget_name;

            if (current_amount !== undefined) {
                if (typeof current_amount !== 'number' || current_amount < 0) {
                    return res.status(400).json({ message: 'current_amount must be a non-negative number.' });
                }
                // Recalculate remaining: how much of the old limit was already spent?
                const amountSpent = budget.current_amount - budget.amount_remaining;
                budget.current_amount = current_amount;
                budget.amount_remaining = Math.max(0, current_amount - amountSpent);
            }

            await budget.save();
            res.status(200).json({
                status: 'success',
                data: budget,
                message: 'Budget updated successfully',
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating budget', error: error.message });
        }
    },

    // DELETE /:budget_id
    delete: async (req, res) => {
        try {
            const { budget_id } = req.params;
            const user_id = req.user.user_id;

            const deletedBudget = await Budget.findOneAndDelete({ budget_id, user_id });
            if (!deletedBudget) {
                return res.status(404).json({ message: 'Budget not found.' });
            }
            res.status(200).json({ message: 'Budget deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting budget', error: error.message });
        }
    },
};

module.exports = BudgetController;
>>>>>>> Stashed changes
