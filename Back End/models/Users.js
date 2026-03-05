import { Schema, model } from 'mongoose';


const userSchema = new Schema({
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    date_created: { type: Date, default: Date.now, required: true}
});

export default model('Users', userSchema);