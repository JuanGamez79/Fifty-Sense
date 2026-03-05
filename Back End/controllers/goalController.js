const Goal = require('../models/Goals');

const GoalController = {
    create: async (req, res) => {
        try {
            const newGoal = await Goal.create(req.body);
            res.status(201).send(newGoal);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedGoal = await Goal.findByIdAndDelete(id);
            
            if (!deletedGoal) {
                return res.status(404).json({ message: "Goal not found" });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

}

export default GoalController;