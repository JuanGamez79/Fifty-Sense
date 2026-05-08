const express = require('express');
const router = express.Router();
const BudgetController = require('../controllers/budgetController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/create',       authenticateToken, BudgetController.create);
router.get('/user/:user_id', authenticateToken, BudgetController.getByUser);
router.delete('/:budget_id', authenticateToken, BudgetController.delete);

module.exports = router;