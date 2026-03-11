const User =  require('../models/Users');

const UserController = {
    create: async (req, res) => {
        try{
            const newUser = await User.create(req.body);
            res.status(201).send(newUser);
        } catch(error) {
            return res.status(404).json({ message: "Error"})  //Temp error message
        }
    },

    delete: async (req, res) => {
        try{
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);

            if(!deletedUser){
                return res.status(404).json({ message: "User not found" });
            }
        } catch(error) {
            return res.status(404).json({ message: "Error"})  //Temp error message
        }
        
    }

};

module.exports = UserController;