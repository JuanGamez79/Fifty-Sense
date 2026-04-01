const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController.js');



router.post('/create', AccountController.createAccount);


router.patch('/:account_id', AccountController.updateAccount);


router.get('/:account_id', AccountController.getSingleAccount);


router.get('/:user_id', AccountController.getUserAccounts)


router.delete('/delete', AccountController.deleteAccount);


module.exports = router;