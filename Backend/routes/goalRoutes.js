const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController.js');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/create', authenticateToken, goalController.createGoal);
router.get('/user/:user_id', authenticateToken, goalController.getUserGoals);
router.get('/:goal_id', authenticateToken, goalController.getSingleGoal);
router.put('/:goal_id', authenticateToken, goalController.updateGoal);
router.delete('/:goal_id', authenticateToken, goalController.deleteGoal);

module.exports = router;