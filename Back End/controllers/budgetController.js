const Budget = require('../models/Budgets');

const BudgetController = {
    create: catchasync(async (req, res) => {
        const newBudget = await Budget.create(req.body);
        res.status(201).send(newBudget);
    }),

    delete: catchasync(async (req, res) => {
        const { id } = req.params;
        const deletedBudget = await Budget.findByIdAndDelete(id);
        
        if (!deletedBudget) {
            return res.status(404).json({ message: "Budget not found" });
        }
        res.status(204).send();
    }),

}

export default BudgetController;