const Goal = require('../models/Goals');

const GoalController = {
    create: catchasync(async (req, res) => {
        const newGoal = await Goal.create(req.body);
        res.status(201).send(newGoal);
    }),

    delete: catchasync(async (req, res) => {
        const { id } = req.params;
        const deletedGoal = await Goal.findByIdAndDelete(id);
        
        if (!deletedGoal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        res.status(204).send();
    })

}

export default GoalController;