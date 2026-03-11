const Category = require('../models/Categories');

const CategoryController = {
    create: catchasync(async (req, res) => {
        const newCategory = await Category.create(req.body);
        res.status(201).send(newCategory);
    }),

    delete: catchasync(async (req, res) => {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory){
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(204).send();
    }),

}

export default CategoryController;