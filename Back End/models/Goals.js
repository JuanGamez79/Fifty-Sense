import { Schema, model } from 'mongoose';


const goalSchema = new Schema({
    goal_id: { type: String, required: true },
    user_id: { type: String, required: true },
    target_amount: { type: Number, required: true },
    current_amount: { type: Number, required: true },
    goal_name: { type: String, required: true },
    deadline: { type: Date, default: Date.now },
    date_created: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
});

export default model('Goals', goalSchema);