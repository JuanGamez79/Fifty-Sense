import { Schema, model } from 'mongoose';


const transactionSchema = new Schema({
    transaction_id: { type: String, required: true },
    account_id: { type: String, required: true },
    to_account_id: { type: String, default: null },
    category_id: { type: String, required: true },
<<<<<<< Updated upstream
    type: { type: String, Enum: ["income", "expense"], required: true },
=======
    type: { type: String, enum: ["income", "expense", "transfer"], required: true },
>>>>>>> Stashed changes
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String }
});

export default model('Transactions', transactionSchema);