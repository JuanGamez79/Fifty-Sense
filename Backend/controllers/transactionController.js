const Transaction = require("../models/Transactions");
const Account = require("../models/Accounts");
const Budget = require("../models/Budgets");

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

            let budgetUpdateInfo = null;
            if (category_id && type === "expense") {
            const budget = await Budget.findOne({ category_id: category_id, is_active: true });
            
            if (budget) {
                // Increase the amount spent
                budget.amount_spent = (budget.amount_spent || 0) + Number(amount);
                await budget.save();
                budgetUpdateInfo = budget.amount_spent;
            }
        }

            const savedTransaction = await newTransaction.save();
            await account.save();

            res.status(201).json({
                status: 'success',
                data: savedTransaction,
                message: "Transaction created successfully",
                new_account_balance: account.balance,
                new_budget_spent: budgetUpdateInfo
            });
        } catch (error) {
            res.status(500).json({ 
                status: 'failed', 
                data: [], 
                message: `Error creating transaction: ${error.message}` 
            });        
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
            const updates = req.body;
            
            const oldTransaction = await Transaction.findOne({ transaction_id: transaction_id, is_active: { $ne: false } });
            if (!oldTransaction) {
                return res.status(404).json({ 
                    status: 'failed', 
                    data: [], 
                    message: "Transaction not found" 
                });
            }

            const newType = updates.type || oldTransaction.type;
            const newAmount = updates.amount !== undefined ? Number(updates.amount) : oldTransaction.amount;
            const newCategoryId = updates.category_id || oldTransaction.category_id;

            // Adjust Account if amount or type changed
            if (updates.amount !== undefined || updates.type !== undefined) {
                const account = await Account.findOne({ account_id: oldTransaction.account_id });
                if (account) {
                    if (oldTransaction.type === "expense") account.balance += oldTransaction.amount;
                    if (oldTransaction.type === "income") account.balance -= oldTransaction.amount;

                    if (newType === "expense") account.balance -= newAmount;
                    if (newType === "income") account.balance += newAmount;

                    await account.save();
                }
            }

            // Adjust Budget if amount, type, or category changed
            if (updates.amount !== undefined || updates.type !== undefined || updates.category_id !== undefined) {
                
                if (oldTransaction.category_id && oldTransaction.type === "expense") {
                    const oldBudget = await Budget.findOne({ category_id: oldTransaction.category_id, is_active: true });
                    if (oldBudget) {
                        oldBudget.amount_spent -= oldTransaction.amount;
                        await oldBudget.save();
                    }
                }

                if (newCategoryId && newType === "expense") {
                    const newBudget = await Budget.findOne({ category_id: newCategoryId, is_active: true });
                    if (newBudget) {
                        newBudget.amount_spent = (newBudget.amount_spent || 0) + newAmount;
                        await newBudget.save();
                    }
                }
            }

            // Update the transaction document
            const updatedTransaction = await Transaction.findOneAndUpdate(
                { transaction_id: transaction_id }, 
                updates, 
                { new: true, runValidators: true } 
            );

            res.status(200).json({
                status: 'success',
                data: updatedTransaction,
                message: "Transaction and related balances updated successfully"
            });
        } catch (error) {
            res.status(500).json({ 
                status: 'failed', 
                data: [], 
                message: `Error updating transaction: ${error.message}` 
            });        
        }
    },

    deleteTransaction: async (req, res) => {
        try {
            const { transaction_id } = req.params;
            
            // Find the transaction before deleting it so we know the amount and type
            const transaction = await Transaction.findOne({ transaction_id: transaction_id, is_active: true });
            if (!transaction) {
                return res.status(404).json({ 
                    status: 'failed', 
                    data: [], 
                    message: "Transaction not found" 
                });
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

            // Update the budget if the transaction was an expense
            let budgetUpdateInfo = null;
            if (transaction.category_id && transaction.type === "expense") {
                const budget = await Budget.findOne({ category_id: transaction.category_id, is_active: true });
                if (budget) {
                    budget.amount_spent -= transaction.amount; // Remove the spent money from the budget
                    await budget.save();
                    budgetUpdateInfo = budget.amount_spent;
                }
            }
            // Delete transaction
            await Transaction.findOneAndDelete(
                { transaction_id: transaction_id },
                { is_active: false },
                { new: true }
            );

            res.status(200).json({ 
            status: 'success',
            data: [],
            message: "Transaction deleted, account and budget adjusted",
            new_account_balance: account ? account.balance : null,
            new_budget_spent: budgetUpdateInfo
        });

        } catch (error) {
            res.status(500).json({ 
                status: 'failed', 
                data: [], 
                message: `Error deleting transaction: ${error.message}` 
            });        
        }
    },

}

module.exports = TransactionController;