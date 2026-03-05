const User =  require('../models/Users');

const UserController = {
    create: async (req, res) => {
        try{
            const newUser = await User.create(req.body);
            res.status(201).send(newUser);
        } catch (error){
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try{
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
    
            if(!deletedUser){
                return res.status(404).json({ message: "User not found" });
            }
        } catch (error){
            res.status(500).json({ message: error.message });
        }
    },


};

export default UserController;