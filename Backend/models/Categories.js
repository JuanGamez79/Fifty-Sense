const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    category_id: { type: String, default: () => crypto.randomUUID(), required: true },
    user_id: { type: String, required: true },
    category_name: { type: String, required: true },
    is_active: { type: Boolean, required: true }
});

const Categories = mongoose.model("Categories", categorySchema);
module.exports = Categories;