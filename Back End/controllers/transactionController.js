const Transaction = require("../models/Transactions");

const TransactionController = {
    create: async (req, res) => {
        try {
            const newTransaction = await Transaction.create(req.body);
            res.status(201).send(newTransaction);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedTransaction = await Transaction.findByIdAndDelete(id);
            if (!deletedTransaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

}

export default TransactionController;