
const accountController = {
    create: async (req, res) => {
        try {
            const newAccount = await Account.create(req.body);
            res.status(201).send(newAccount);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedAccount = await Account.findByIdAndDelete(id);
            
            if (!deletedAccount) {
                return res.status(404).json({ message: "Account not found" });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


}

export default accountController;