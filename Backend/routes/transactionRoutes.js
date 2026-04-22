const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const authenticateToken = require('../middleware/authMiddleware');

// POST /api/transactions/create
// Creates a new transaction and automatically updates the linked account's balance.
// Frontend sends: account_id, category_id, type ("income" or "expense"), amount, date (optional), description (optional).
// Success response includes the saved transaction and the newly updated account balance.
router.post('/create', TransactionController.createTransaction);

// GET /api/transactions/account/:account_id
// Returns a list of all transactions associated with a specific account.
// Frontend must send: account_id
// Use this to populate the ledger/history view for a specific account, usually sorted newest first.
router.get('/account/:account_id', TransactionController.getAccountTransactions);

// GET /api/transactions/:transaction_id
// Returns a single transaction based on its custom transaction_id.
// Frontend must send: transaction_id
// Use this for a "transaction details" view or right before editing a transaction.
router.get('/:transaction_id', TransactionController.getSingleTransaction);

// PATCH /api/transactions/:transaction_id
// Updates an existing transaction's details.
// Frontend sends: transaction_id and any fields being updated in the request body.
// Note: If modifying the 'amount' or 'type', ensure the frontend/backend syncs the math for the linked account balance.
router.patch('/:transaction_id', TransactionController.updateTransaction);

// DELETE /api/transactions/:transaction_id
// Deletes a transaction permanently and reverses its effect on the linked account.
// Frontend must send: transaction_id
// Success response confirms deletion and returns the newly adjusted account balance.
router.delete('/:transaction_id', TransactionController.deleteTransaction);

module.exports = router;