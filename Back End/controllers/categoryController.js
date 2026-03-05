const Category = require('../models/Categories');

const CategoryController = {
    create: async (req, res) => {
        try{
            const newCategory = await Category.create(req.body);
            res.status(201).send(newCategory);
        } catch (error){
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try{
            const { id } = req.params;
            const deletedCategory = await Category.findByIdAndDelete(id);

            if (!deletedCategory){
                return res.status(404).json({ message: "Category not found" });
            }
            res.status(204).send();
        } catch (error){
            res.status(500).json({ message: error.message });
        }
    },

}

export default CategoryController;