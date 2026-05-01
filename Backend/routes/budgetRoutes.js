const express = require('express');
const router = express.Router();
const BudgetController = require('../controllers/budgetController.js');


// POST /api/budgets/create
// Creates a new budget.
// Frontend sends: category_id, budget_name, budgeted_amount, amount_remaining
// Success response includes the newly created budget data.
// Use this when the "Create Budget" form is submitted.
router.post('/create', BudgetController.createBudget);

// GET /api/budgets/user/:user_id
// Retrieves all active budgets for a specific user.
// Frontend sends: user_id as a URL parameter.
// Success response includes an array of the user's active budget objects.
// Use this to populate the main budgets dashboard for the logged-in user.
router.get('/user/:user_id', BudgetController.getAllActiveBudgets);

// GET /api/budgets/:budget_id
// Retrieves the details of a specific active budget.
// Frontend sends: budget_id as a URL parameter.
// Success response includes a single budget data object.
// Use this when navigating to a detailed view of a single budget.
router.get('/:budget_id', BudgetController.getBudgetById);

// PATCH /api/budgets/:budget_id
// Updates an existing active budget.
// Frontend sends: budget_id as a URL parameter. Any of: category_id, budget_name, budgeted_amount, amount_remaining in the body.
// Success response includes the updated budget data.
// Use this when a user edits a budget's details or when transactions adjust the amounts.
router.patch('/:budget_id', BudgetController.updateBudget);

// DELETE /api/budgets/:budget_id
// Soft deletes (archives) a specific budget by setting is_active to false.
// Frontend sends: budget_id as a URL parameter.
// Success response includes a confirmation message and the archived budget data.
// Use this when a user clicks "Delete" on a budget.
router.delete('/:budget_id', BudgetController.deleteBudget);

module.exports = router;