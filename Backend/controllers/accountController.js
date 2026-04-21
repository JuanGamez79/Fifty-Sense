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
            const account = await Account.findById({ _id: account_id, is_active: { $ne: false } });
            
            if (!account) {
                return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'Account not found'
                });            
            }
            
            return res.status(200).json({
                status: 'success',
                data: [account],
                message: 'Account successfully fetched'
            });
        } catch(error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error fetching account',
                error: error.message
            });        
        }
    },

    getUserAccounts: async (req, res) => {
        try{
            const { user_id } = req.params;
            
            const accounts = await Account.find({ user_id: user_id, is_active: { $ne: false } });            
            
            return res.status(200).json({
                status: 'success',
                data: accounts, 
                message: 'Accounts successfully fetched'
            });
        } catch(error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error fetching accounts',
                error: error.message
            });
        }
    },

    updateAccount: async (req, res) => {
        try{
            const { account_id } = req.params;
    
            const updatedAccount = await Account.findOneAndUpdate(
                { _id: account_id, is_active: { $ne: false } },
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedAccount) {
               return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'Account not found'
                });
            }
            
            return res.status(200).json({
                status: 'success',
                data: [updatedAccount],
                message: 'Account successfully updated'
            });
        } catch(error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error updating account',
                error: error.message
            });
        }
           
    },
    
    deleteAccount: async (req, res) => {
        try{
            const { account_id } = req.params;
            const deletedAccount = await Account.findOneAndUpdate(
                { _id: account_id, is_active: { $ne: false } },
                { is_active: false },
                { new: true }
            );
            
            if (!deletedAccount) {
               return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'Account not found or already deleted'
                });
            }
            
            return res.status(200).json({
                status: 'success',
                data: [],
                message: 'Account deleted successfully'
            });
        } catch(error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error deleting account',
                error: error.message
            });
        }
    },

}

module.exports = accountController;