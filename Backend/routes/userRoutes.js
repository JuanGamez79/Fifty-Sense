const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// POST /api/users/register
router.post('/register', UserController.register);

// POST /api/users/login
router.post('/login', UserController.login);

// POST /api/users/forgot-password  ← no auth, user isn't logged in
router.post('/forgot-password', UserController.forgotPassword);

// POST /api/users/reset-password   ← no auth, user isn't logged in
router.post('/reset-password', UserController.resetPassword);

// GET /api/users/profile
router.get('/profile', authenticateToken, UserController.getProfile);

// PUT /api/users/:id/email
router.put('/:id/email', authenticateToken, UserController.changeEmail);

// PUT /api/users/:id/password
router.put('/:id/password', authenticateToken, UserController.changePassword);

// PUT /api/users/:id
router.put('/:id', authenticateToken, UserController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, UserController.deleteUser);

module.exports = router;