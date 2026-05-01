const Budget = require('../models/Budgets');

const BudgetController = {
    createBudget: async (req, res) => {
        try {
            const { category_id, budget_name, budgeted_amount, amount_spent } = req.body;

            const newBudget = new Budget({
                category_id,
                budgeted_amount,
                amount_spent
            });

            const savedBudget = await newBudget.save();

            res.status(201).json({
                status: 'success',
                data: savedBudget,
                message: 'Budget created successfully'
            });
        } catch (error) {
            res.status(400).json({
                status: 'failed',
                data: [],
                message: `Failed to create budget: ${error.message}`
            });
        }
    },

    getAllActiveBudgets: async (req, res) => {
        try {
            const { user_id } = req.params;

            const budgets = await Budget.find({ 
                user_id: user_id, 
                is_active: true 
            }).sort({ date_created: -1 });

            res.status(200).json({
                status: 'success',
                count: budgets.length,
                data: budgets,
                message: 'User budgets retrieved successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'failed',
                data: [],
                message: `Failed to fetch budgets: ${error.message}`
            });
        }
    },


    getBudgetById: async (req, res) => {
        try {
            const { budget_id } = req.params;
        
            const budget = await Budget.findOne({ budget_id: budget_id, is_active: true });

            if (!budget) {
                return res.status(404).json({ 
                    status: 'failed',
                    data: [],
                    message: 'Budget not found' 
                });
            }

            res.status(200).json({
                status: 'success',
                data: budget,
                message: 'Budget retrieved successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'failed',
                data: [],
                message: `Server Error: ${error.message}`
            });
        }
    },

    updateBudget: async (req, res) => {
        try {
            const budget_id = req.params;
            
            const updatedBudget = await Budget.findOneAndUpdate(
                { budget_id: budget_id, is_active: true },
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedBudget) {
                return res.status(404).json({ 
                    status: 'failed', 
                    data: [], 
                    message: 'Budget not found or inactive' 
                });
            }

            res.status(200).json({
                status: 'success',
                data: updatedBudget,
                message: 'Budget updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                status: 'failed',
                data: [],
                message: `Failed to update budget: ${error.message}`
            });
        }
    },

    deleteBudget: async (req, res) => {
        try {
            const budget_id = req.params;
            
            const budget = await Budget.findOneAndUpdate(
                { budget_id: budget_id, is_active: true },
                { is_active: false },
                { new: true }
            );

            if (!budget) {
                return res.status(404).json({ 
                    status: 'failed', 
                    data: [], 
                    message: 'Budget not found or already deleted'
                 });
            }

            res.status(200).json({
                status: 'success',
                data: budget, 
                message: 'Budget successfully archived'
            });
        } catch (error) {
            res.status(500).json({
                status: 'failed',
                data: [],
                message: `Failed to delete budget: ${error.message}`
            });
        }
    },
}

module.exports = BudgetController;