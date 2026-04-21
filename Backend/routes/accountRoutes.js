const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController.js');
const authenticateToken = require('../middleware/authMiddleware'); // ← fix

router.post('/create', authenticateToken, AccountController.createAccount);
router.get('/user/:user_id', authenticateToken, AccountController.getUserAccounts);
router.get('/:account_id', authenticateToken, AccountController.getSingleAccount);
router.put('/:account_id', authenticateToken, AccountController.updateAccount);
router.delete('/delete/:account_id', authenticateToken, AccountController.deleteAccount);

module.exports = router;