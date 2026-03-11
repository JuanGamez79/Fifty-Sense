const express = requires('express');
const router = express.Router();
import * as TransactionController from '../controllers/transactionController.js';

router.post('/api/users', TransactionController.create);
router.delete('/api/users', TransactionController.delete);