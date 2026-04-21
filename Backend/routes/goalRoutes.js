const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController.js')

// POST /create
// Creates a new financial goal.
// Frontend sends: goal_id, user_id, target_amount, current_amount, goal_name, and deadline in the body.
// Success response includes the newly created goal object.
// Use this when the user sets up a new savings or debt payoff goal.
router.post('/create', goalController.createGoal);

// GET /:goal_id
// Retrieves a single active goal's details.
// Frontend sends: goal_id in the URL path.
// Success response includes a single goal object.
// Use this when opening a specific goal's detail view to check progress.
router.get('/:goal_id', goalController.getSingleGoal);

// GET /user/:user_id
// Retrieves all active goals belonging to a specific user.
// Frontend sends: user_id in the URL path.
// Success response includes an array of goal objects.
// Use this to populate the user's dashboard or goals list.
router.get('/user/:user_id', goalController.getUserGoals);

// PUT /:goal_id
// Updates an existing active goal's details.
// Frontend sends: goal_id in the URL path; updated fields in the body.
// Success response includes the updated goal object.
// Use this when the user updates a target amount, deadline, or renames the goal.
router.put('/:goal_id', goalController.updateGoal);

// DELETE /:goal_id
// Soft deletes a specific goal by marking it inactive.
// Frontend sends: goal_id in the URL path.
// Success response includes a success message.
// Use this when a user removes a goal they no longer wish to track.
router.delete('/:goal_id', goalController.deleteGoal);


module.exports = router;