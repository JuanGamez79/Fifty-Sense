
const accountController = {
    create: async (req, res) => {
        try{
            const newAccount = await Account.create(req.body);
            res.status(201).send(newAccount);
        } catch(error) {
             return res.status(500).json({ message: "Error"})  //Temp error message
        }
    },

    delete: async (req, res) => {
        try{
            const { id } = req.params;
            const deletedAccount = await Account.findByIdAndDelete(id);
            
            if (!deletedAccount) {
                return res.status(404).json({ message: "Account not found" });
            }
            
            res.status(204).send();
        } catch(error) {
            return res.status(500).json({ message: "Error"})  //Temp error message
        }
    },

    getAll: async (req, res) => {
        try{

        } catch(error) {
             return res.status(500).json({ message: "Error"})  //Temp error message
        }
        const allAccounts = await Account.find({});
        res.status(200).json();
    },

    getById: async (req, res) => {
        try{
            const account = await Account.findById(req.params.id);
        
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.status(200).json(account);
        } catch(error) {
            return res.status(500).json({ message: "Error"})  //Temp error message
        }
        
    },

    updateBalance: async (req, res) => {
        try{
            const { id } = req.params;
            const { balance } = req.body;

            if (balance === undefined) {
                return res.status(400).json({ error: 'Please provide a new balance.' }); 
            }
            
            const updatedAccount = await Account.findByIdAndUpdate(
                id,
                { balance: balance }, 
                { 
                new: true,           
                runValidators: true  
                }
            );

            if (!updatedAccount) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.status(200).json(updatedAccount);
        } catch(error) {
             return res.status(500).json({ message: "Error"})  //Temp error message

        }
           
    }

}

module.export = accountController;