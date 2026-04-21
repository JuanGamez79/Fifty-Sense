const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController.js');


// POST /create
// Creates a new financial account.
// Frontend sends: user_id, account_name, balance in the body.
// Success response includes the newly created account object.
// Use this when the user adds a new bank account or wallet.
router.post('/create', AccountController.createAccount);

// PATCH /:account_id
// Updates an existing account's details.
// Frontend sends: account_id in the URL path; updated fields in the body.
// Success response includes the updated account object.
// Use this when the user edits an account name or manually updates a balance.
router.patch('/:account_id', AccountController.updateAccount);

// GET /:account_id
// Retrieves a single account's details.
// Frontend sends: account_id in the URL path.
// Success response includes a single account object.
// Use this when opening a specific account's detail view.
router.get('/:account_id', AccountController.getSingleAccount);

// GET /user/:user_id
// Retrieves all accounts belonging to a specific user.
// Frontend sends: user_id in the URL path.
// Success response includes an array of account objects.
// Use this to populate the user's dashboard or account list.
router.get('/user/:user_id', AccountController.getUserAccounts)


// DELETE /delete/:accountId
// Permanently deletes a specific account.
// Frontend sends: accountId in the URL path.
// Success response includes a success message.
// Use this when a user removes an account from their profile.
router.delete('/delete/:account_id', AccountController.deleteAccount);


module.exports = router;