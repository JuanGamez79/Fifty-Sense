import { Schema, model } from 'mongoose';


const accountSchema = new Schema({
    account_id: { type: String, required: true },
    user_id: { type: String, required: true },
    account_name: { type: String, required: true },
    balance: { type: Number }
});

export default model('Accounts', accountSchema);