const Transaction = require("../models/Transactions");
const Account = require("../models/Accounts");

const TransactionController = {
    createTransaction: async (req, res) => {
        try {
            const { account_id, category_id, type, amount, date, description } = req.body;

            const newTransaction = new Transaction({
                account_id,
                category_id,
                type,
                amount,
                date,
                description
            });

            const account = await Account.findOne({ account_id : account_id });
            if (!account) {
                return res.status(404).json({ message: "Transaction saved, but linked Account not found." });
            }
            

            if (type === "income") {
                account.balance += Number(amount);
            } 
            
            else if (type === "expense") {
                account.balance -= Number(amount);
            }


            const savedTransaction = await newTransaction.save();
            await account.save();

            res.status(201).json({
                message: "Transaction created and balance updated successfully",
                transaction: savedTransaction,
                new_balance: account.balance
            });
        } catch (error) {
            res.status(500).json({ message: "Error creating transaction", error: error.message });
        }
    },

    getAccountTransactions: async (req, res) => {
        try {
            const { account_id } = req.params;
            
            const transactions = await Transaction.find({ account_id: account_id }).sort({ date: -1 });
            
            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ message: "Error fetching transactions", error: error.message });
        }
    },

    getSingleTransaction: async (req, res) => {
        try {
            const { transaction_id } = req.params;
            
            const transaction = await Transaction.findOne({ transaction_id: transaction_id });
            
            if (!transaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            res.status(200).json(transaction);
        } catch (error) {
            res.status(500).json({ message: "Error fetching transaction", error: error.message });
        }
    },

    updateTransaction: async (req, res) => {
        try {
            const { transaction_id } = req.params;
            
            const updatedTransaction = await Transaction.findOneAndUpdate(
                { transaction_id: transaction_id }, 
                req.body, 
                { new: true, runValidators: true } 
            );

            if (!updatedTransaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            res.status(200).json(updatedTransaction);
        } catch (error) {
            res.status(500).json({ message: "Error updating transaction", error: error.message });
        }
    },

    deleteTransaction: async (req, res) => {
        try {
            const { transaction_id } = req.params;
            
            // Find the transaction before deleting it so we know the amount and type
            const transaction = await Transaction.findOne({ transaction_id: transaction_id, is_active: { $ne: false } });
            if (!transaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            // Find the linked account
            const account = await Account.findOne({ account_id : transaction.account_id });
            
            // If we delete an expense, we add the money back. If we delete income, we subtract it.
            if (account) { 
                if (transaction.type === "expense") {
                    account.balance += transaction.amount;
                } 
                
                else if (transaction.type === "income") {
                    account.balance -= transaction.amount;
                }
            
                await account.save();
            }

            // Delete transaction
            await Transaction.findOneAndDelete(
                { transaction_id: transaction_id },
                { is_active: false },
                { new: true }
            );

            res.status(200).json({ 
                message: "Transaction deleted and balance adjusted",
                new_balance: account ? account.balance : null
            });

        } catch (error) {
            res.status(500).json({ message: "Error deleting transaction", error: error.message });
        }
    },

}

module.exports = TransactionController;