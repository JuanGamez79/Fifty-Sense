const express = requires('express');
const router = express.Router();
import * as AccountController from '../controllers/accountController.js';

router.post('/api/users', AccountController.create);
router.delete('/api/users', AccountController.delete);