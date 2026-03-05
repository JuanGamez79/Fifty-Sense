const express = requires('express');
const router = express.Router();
import * as UserController from '../controllers/userController.js';

router.post('/api/users', UserController.create);
router.delete('/api/users', UserController.delete);