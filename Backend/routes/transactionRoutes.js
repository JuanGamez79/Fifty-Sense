const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/create', authenticateToken, TransactionController.createTransaction);
router.get('/account/:account_id', authenticateToken, TransactionController.getAccountTransactions);
router.get('/:transaction_id', authenticateToken, TransactionController.getSingleTransaction);
router.put('/:transaction_id', authenticateToken, TransactionController.updateTransaction);
router.delete('/:transaction_id', authenticateToken, TransactionController.deleteTransaction);

module.exports = router;