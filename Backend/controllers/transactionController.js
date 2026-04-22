const Transaction = require("../models/Transactions");

const TransactionController = {
<<<<<<< Updated upstream
    create: catchasync(async (req, res) => {
        const newTransaction = await Transaction.create(req.body);
        res.status(201).send(newTransaction);
    }),

    delete: catchasync(async (req, res) => {
        const { id } = req.params;
        const deletedTransaction = await Transaction.findByIdAndDelete(id);
        if (!deletedTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.status(204).send();
    }),
=======
    createTransaction: async (req, res) => {
        try {
            const { account_id, to_account_id, category_id, type, amount, date, description } = req.body;

            // Validate transfer has a destination account
            if (type === "transfer") {
                if (!to_account_id) {
                    return res.status(400).json({ message: "Transfer requires a destination account (to_account_id)." });
                }
                if (account_id === to_account_id) {
                    return res.status(400).json({ message: "Source and destination accounts must be different." });
                }
            }

            const newTransaction = new Transaction({
                account_id,
                to_account_id: type === "transfer" ? to_account_id : null,
                category_id,
                type,
                amount,
                date,
                description
            });

            const account = await Account.findOne({ account_id: account_id });
            if (!account) {
                return res.status(404).json({ message: "Source account not found." });
            }

            if (type === "income") {
                account.balance += Number(amount);
            } else if (type === "expense") {
                account.balance -= Number(amount);
            } else if (type === "transfer") {
                const toAccount = await Account.findOne({ account_id: to_account_id });
                if (!toAccount) {
                    return res.status(404).json({ message: "Destination account not found." });
                }
                account.balance -= Number(amount);
                toAccount.balance += Number(amount);
                await toAccount.save();
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
            
            res.status(200).json({
                status: 'success',
                data: transactions,
                message: 'Transactions successfully fetched'
            });
        } catch (error) {
            res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error fetching transactions',
                error: error.message
            });
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

            const originalTransaction = await Transaction.findOne({ transaction_id });
            if (!originalTransaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            const sourceAccount = await Account.findOne({ account_id: originalTransaction.account_id });

            if (sourceAccount) {
                if (originalTransaction.type === "income") {
                    sourceAccount.balance -= originalTransaction.amount;
                } else if (originalTransaction.type === "expense") {
                    sourceAccount.balance += originalTransaction.amount;
                } else if (originalTransaction.type === "transfer" && originalTransaction.to_account_id) {
                    sourceAccount.balance += originalTransaction.amount;
                    const origDest = await Account.findOne({ account_id: originalTransaction.to_account_id });
                    if (origDest) {
                        origDest.balance -= originalTransaction.amount;
                        await origDest.save();
                    }
                }
            }

            const newType   = req.body.type   ?? originalTransaction.type;
            const newAmount = req.body.amount  ?? originalTransaction.amount;
            const newToAccountId = req.body.to_account_id ?? originalTransaction.to_account_id;

            if (sourceAccount) {
                if (newType === "income") {
                    sourceAccount.balance += Number(newAmount);
                } else if (newType === "expense") {
                    sourceAccount.balance -= Number(newAmount);
                } else if (newType === "transfer") {
                    if (!newToAccountId) {
                        return res.status(400).json({ message: "Transfer requires a destination account." });
                    }
                    sourceAccount.balance -= Number(newAmount);
                    const newDest = await Account.findOne({ account_id: newToAccountId });
                    if (newDest) {
                        newDest.balance += Number(newAmount);
                        await newDest.save();
                    }
                }
                await sourceAccount.save();
            }

            const updatedTransaction = await Transaction.findOneAndUpdate(
                { transaction_id },
                { ...req.body, to_account_id: newType === "transfer" ? newToAccountId : null },
                { new: true, runValidators: true }
            );

            res.status(200).json({
                message: "Transaction updated and balance recalculated",
                transaction: updatedTransaction,
                new_balance: sourceAccount ? sourceAccount.balance : null,
            });
        } catch (error) {
            res.status(500).json({ message: "Error updating transaction", error: error.message });
        }
    },

    deleteTransaction: async (req, res) => {
        try {
            const { transaction_id } = req.params;
            
            const transaction = await Transaction.findOne({ transaction_id: transaction_id, is_active: { $ne: false } });
            if (!transaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            const account = await Account.findOne({ account_id: transaction.account_id });
            
            if (account) { 
                if (transaction.type === "expense") {
                    account.balance += transaction.amount;
                } else if (transaction.type === "income") {
                    account.balance -= transaction.amount;
                } else if (transaction.type === "transfer" && transaction.to_account_id) {
                    // Reverse: add back to source, deduct from destination
                    account.balance += transaction.amount;
                    const toAccount = await Account.findOne({ account_id: transaction.to_account_id });
                    if (toAccount) {
                        toAccount.balance -= transaction.amount;
                        await toAccount.save();
                    }
                }
                await account.save();
            }

            await Transaction.findOneAndDelete({ transaction_id: transaction_id });

            res.status(200).json({ 
                message: "Transaction deleted and balance adjusted",
                new_balance: account ? account.balance : null
            });

        } catch (error) {
            res.status(500).json({ message: "Error deleting transaction", error: error.message });
        }
    },
>>>>>>> Stashed changes

}

export default TransactionController;