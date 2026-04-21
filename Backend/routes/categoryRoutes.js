const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController.js');


// POST /api/categories/create
// Creates a new category.
// Frontend sends: user_id, category_name
// Success response includes the newly created category object (with is_active defaulting to true).
// Use this when the user clicks "Add Category" in their budget settings.
router.post('/create', categoryController.createCategory);

// GET /api/categories/detail/:category_id
// Retrieves a single category's details.
// Frontend sends: category_id in the URL path.
// Success response includes a single category object.
// Use this when opening a specific category's detail page or edit modal.
router.get('/detail/:category_id', categoryController.getCategoryById);

// GET /api/categories/:user_id
// Retrieves all active categories belonging to the user.
// Frontend sends: user_id in the URL path.
// Success response includes an array of category objects where is_active is true.
// Use this when loading the budget dashboard or populating the category dropdown in a new transaction form.
router.get('/:user_id', categoryController.getUserCategories);

// PATCH /api/categories/:category_id
// Updates an existing category's details (e.g., renaming it).
// Frontend sends: category_id in the URL; updated category_name in the body.
// Success response includes the updated category object.
// Use this when the user submits changes from the "Edit Category" form.
router.patch('/:category_id', categoryController.updateCategory);

// DELETE /api/categories/:category_id
// Soft-deletes a category so it can no longer be used for new transactions.
// Frontend sends: category_id in the URL.
// Success response includes a success message and the deleted category_id.
// Use this when the user clicks the "Delete" button on a category to set is_active to false.
router.delete('/:category_id', categoryController.deleteCategory);


module.exports = router;