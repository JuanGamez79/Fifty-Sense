const Account = require('../models/Accounts');

const accountController = {
    createAccount: async (req, res) => {
        try{
            const { user_id, account_name, balance } = req.body;
    
            const newAccount = new Account({
                user_id,
                account_name,
                balance
            });

            const savedAccount = await newAccount.save();
            res.status(201).send(savedAccount);
        } catch(error) {
            res.status(500).json({ message: "Error creating account", error: error.message });        }
    },

    getSingleAccount: async (req, res) => {
        try{
            const { account_id } = req.params;
            const account = await Account.findById(account_id);
            
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }
            
            res.status(200).json(account);
        } catch(error) {
            res.status(500).json({ message: "Error fetching account", error: error.message });        
        }
    },

    getUserAccounts: async (req, res) => {
        try{
            const { userId } = req.params;
            // Finds all accounts matching the user_id
            const accounts = await Account.find({ user_id: userId });
            res.status(200).json(accounts);
        } catch(error) {
            res.status(500).json({ message: "Error fetching accounts", error: error.message });        }
    },

    updateAccount: async (req, res) => {
        try{
            // --- OLD IMPLEMENTATION ---
            // const { id } = req.params;
            // const { balance } = req.body;

            // if (balance === undefined) {
            //     return res.status(400).json({ error: 'Please provide a new balance.' }); 
            // }
            
            // const updatedAccount = await Account.findByIdAndUpdate(
            //     id,
            //     { balance: balance }, 
            //     { 
            //     new: true,           
            //     runValidators: true  
            //     }
            // );

            // if (!updatedAccount) {
            //     return res.status(404).json({ error: 'Account not found' });
            // }

            // res.status(200).json(updatedAccount);
            const { account_id } = req.params;
    
            const updatedAccount = await Account.findByIdAndUpdate(
                account_id, 
                req.body, 
                { new: true, runValidators: true } 
            );

            if (!updatedAccount) {
                return res.status(404).json({ message: "Account not found" });
            }
            
            res.status(200).json(updatedAccount);
        } catch(error) {
            res.status(500).json({ message: "Error updating account", error: error.message });
        }
           
    },
    
    deleteAccount: async (req, res) => {
        try{
            const { accountId } = req.params;
            const deletedAccount = await Account.findByIdAndDelete(accountId);
            
            if (!deletedAccount) {
                return res.status(404).json({ message: "Account not found" });
            }
            
            res.status(200).json({ message: "Account deleted successfully" });
        } catch(error) {
            res.status(500).json({ message: "Error deleting account", error: error.message });        
        }
    },

}

module.exports = accountController;