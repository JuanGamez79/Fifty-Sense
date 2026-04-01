const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// POST /api/users/register
// Creates a new user account.
// Frontend sends: user_id, first_name, last_name, email, password
// Success response includes safe user data + JWT token.
// Use this when the Create Account form is submitted.
router.post('/register', UserController.register);

// POST /api/users/login
// Logs in an existing user.
// Frontend sends: email, password
// Success response includes safe user data + JWT token.
// Save the returned token on the frontend and send it in future protected requests.
router.post('/login', UserController.login);

// GET /api/users/profile
// Returns the currently authenticated user's profile.
// Frontend must send:
// Authorization: Bearer <token>
// Use this to restore user state after refresh or load account/profile data.
router.get('/profile', authenticateToken, UserController.getProfile);

// DELETE /api/users/:id
// Deletes a user by MongoDB document id.
// This is mostly for backend/admin/dev use unless the app includes account deletion.
router.delete('/:id', UserController.deleteUser);

module.exports = router;