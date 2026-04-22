const express = requires('express');
const router = express.Router();
import * as BudgetController from '../controllers/budgetController.js';

<<<<<<< Updated upstream
router.post('/api/users', BudgetController.create);
router.delete('/api/users', BudgetController.delete);
=======
router.get('/', authenticateToken, BudgetController.getAll);
router.post('/create', authenticateToken, BudgetController.create);
router.put('/:budget_id', authenticateToken, BudgetController.update);
router.delete('/:budget_id', authenticateToken, BudgetController.delete);

module.exports = router;
>>>>>>> Stashed changes
