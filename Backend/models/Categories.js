const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    category_id: { type: String },
    user_id: { type: String },
    category_name: { type: String },
    is_active: { type: Boolean }
});

const Categories = mongoose.model("Categories", categorySchema);
module.exports = Categories;