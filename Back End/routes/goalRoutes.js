const express = requires('express');
const router = express.Router();
import * as GoalController from '../controllers/goalController.js';

router.post('/api/users', GoalController.create);
router.delete('/api/users', GoalController.delete);