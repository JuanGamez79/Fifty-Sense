const Category = require('../models/Categories');

const CategoryController = {
    createCategory: async (req, res) => {
       try {
            const { user_id, category_name } = req.body;

            const newCategory = new Category({
                user_id,
                category_name,
                is_active: true
            });

            const savedCategory = await newCategory.save();

            return res.status(201).json({
                status: 'success',
                data: [{ category: savedCategory }],
                message: 'Your category has been successfully created.',
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                data: [],
                message: 'Error creating category: ' + error.message,
            });
        }
        
    },
    
    getCategoryById: async (req, res) => {
        try {
            const { category_id } = req.params;

            const category = await Category.findById(category_id);

            // Case: ID is valid but no document exists
            if (!category) {
                return res.status(404).json({
                    status: 'error',
                    data: [],
                    message: 'Category not found.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [{ category: category }],
                message: 'Category details successfully retrieved.',
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                data: [],
                message: 'Error fetching category details: ' + error.message,
            });
        }
    },

    getUserCategories: async (req, res) => {
        try {
            const { user_id } = req.params;
            
            const categories = await Category.find({ user_id: user_id, is_active: true });

            return res.status(200).json({
                status: 'success',
                data: categories,
                message: 'Categories successfully retrieved.',
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                data: [],
                message: 'Error fetching categories: ' + error.message,
            });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { category_id } = req.params;

            const updatedCategory = await Category.findByIdAndUpdate(
                category_id,
                req.body, 
                { new: true, runValidators: true }
            );

            if (!updatedCategory) {
                return res.status(404).json({
                    status: 'error',
                    data: [],
                    message: 'Category not found.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [{ category: updatedCategory }],
                message: 'Your category has been successfully updated.',
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                data: [],
                message: 'Error updating category: ' + error.message,
            });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { category_id } = req.params;

            // Soft-delete
            const deletedCategory = await Category.findByIdAndUpdate(
                category_id,
                { is_active: false },
                { new: true }
            );

            if (!deletedCategory) {
                return res.status(404).json({
                    status: 'error',
                    data: [],
                    message: 'Category not found.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [{ category_id: deletedCategory._id }],
                message: 'Your category has been successfully deleted.',
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                data: [],
                message: 'Error deleting category: ' + error.message,
            });
        }
    }

}

module.exports = CategoryController;