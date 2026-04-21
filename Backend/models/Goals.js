const mongoose = require('mongoose');


const goalSchema = new mongoose.Schema({
    goal_id: { type: String, default: () => crypto.randomUUID(), required: true, },
    user_id: { type: String, required: true },
    target_amount: { type: Number, required: true },
    current_amount: { type: Number, required: true },
    goal_name: { type: String, required: true },
    deadline: { type: Date, default: Date.now },
    date_created: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
});

const Goals = mongoose.model("Goals", goalSchema);
module.exports = Goals;