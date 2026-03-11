const express = requires('express');
const router = express.Router();
import * as BudgetController from '../controllers/budgetController.js';

router.post('/api/users', BudgetController.create);
router.delete('/api/users', BudgetController.delete);