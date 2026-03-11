const Transaction = require("../models/Transactions");

const TransactionController = {
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

}

export default TransactionController;