const express = require('express');
const router = express.Router();
const BudgetController = require('../controllers/budgetController.js');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/create', authenticateToken, BudgetController.create);
router.delete('/:budget_id', authenticateToken, BudgetController.delete);

module.exports = router;