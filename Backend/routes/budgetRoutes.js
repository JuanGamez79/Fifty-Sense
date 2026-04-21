const express = require('express');
const router = express.Router();
const BudgetController = require('../controllers/budgetController.js');


router.post('/api/users', BudgetController.create);

router.delete('/api/users', BudgetController.delete);

module.exports = router;