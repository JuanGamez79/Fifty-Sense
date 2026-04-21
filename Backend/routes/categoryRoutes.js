const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController.js');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/create', authenticateToken, categoryController.createCategory);
router.get('/detail/:category_id', authenticateToken, categoryController.getCategoryById);
router.put('/:category_id', authenticateToken, categoryController.updateCategory);
router.delete('/:category_id', authenticateToken, categoryController.deleteCategory);
router.get('/:user_id', authenticateToken, categoryController.getUserCategories); // ← fixed
module.exports = router;