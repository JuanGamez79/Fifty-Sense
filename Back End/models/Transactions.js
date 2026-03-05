import { Schema, model } from 'mongoose';


const transactionSchema = new Schema({
    transaction_id: { type: String, required: true },
    account_id: { type: String, required: true },
    category_id: { type: String, required: true },
    type: { type: String, Enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String }
});

export default model('Transactions', transactionSchema);