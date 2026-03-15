import { Schema, model } from 'mongoose';


const categorySchema = new Schema({
    category_id: { type: String, required: true },
    user_id: { type: String, required: true },
    category_name: { type: String, required: true },
});

export default model('Categories', categorySchema);