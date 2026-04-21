const Goal = require('../models/Goals');

const GoalController = {
    createGoal: async (req, res) => {
        try {
            const { goal_id, user_id, target_amount, current_amount, goal_name, deadline } = req.body;

            const newGoal = new Goal({
                goal_id,
                user_id,
                target_amount,
                current_amount,
                goal_name,
                deadline
            });

            const savedGoal = await newGoal.save();

            return res.status(201).json({
                status: 'success',
                data: [savedGoal],
                message: 'Goal successfully created'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error creating goal',
                error: error.message
            });
        }
    },

    getSingleGoal: async (req, res) => {
        try {
            const { goal_id } = req.params;

            const goal = await Goal.findOne({ goal_id: goal_id, is_active: { $ne: false } });

            if (!goal) {
                return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'Goal not found'
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [goal],
                message: 'Goal successfully fetched'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error fetching goal',
                error: error.message
            });
        }
    },

    getUserGoals: async (req, res) => {
        try {
            const { user_id } = req.params;

            const goals = await Goal.find({ user_id: user_id, is_active: { $ne: false } });

            return res.status(200).json({
                status: 'success',
                data: goals, 
                message: 'User goals successfully fetched'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error fetching user goals',
                error: error.message
            });
        }
    },

    updateGoal: async (req, res) => {
        try {
            const { goal_id } = req.params;

            const updatedGoal = await Goal.findOneAndUpdate(
                { goal_id: goal_id, is_active: { $ne: false } },
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedGoal) {
                return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'Goal not found'
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [updatedGoal],
                message: 'Goal successfully updated'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error updating goal',
                error: error.message
            });
        }
    },

    deleteGoal: async (req, res) => {
        try {
            const { goal_id } = req.params;

            const deletedGoal = await Goal.findOneAndUpdate(
                { goal_id: goal_id, is_active: { $ne: false } },
                { is_active: false },
                { new: true }
            );

            if (!deletedGoal) {
                return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'Goal not found or already deleted'
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [],
                message: 'Goal deleted successfully'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Error deleting goal',
                error: error.message
            });
        }
    }
}

module.exports = GoalController;