const express = require('express');
const router = express.Router();
// import * as AccountController from '../controllers/accountController.js';
const AccountController = require('../controllers/accountController.js');

router.post('/', AccountController.create);
router.delete('/', AccountController.delete);
router.get('/', AccountController.getAll);
router.patch('/:id', AccountController.updateBalance);

module.exports = router;