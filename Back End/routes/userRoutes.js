const express = require('express');
const router = express.Router();
const User = require('../models/Users');


router.post('/', async (req, res) => {
        try{
            const { id, email, password, first_name, last_name, date_created } = req.body;
            const newUser = await User.create(req.body);
            res.status(201).send(newUser);
        } catch(error) {
            console.error("Creation Error: ", error);
            return res.status(500).json({ message: "User creation error"})  
        }
    });
    
router.delete('/:id', async (req, res) => {
        try{
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);

            if(!deletedUser){
                return res.status(404).json({ message: "User not found" });
            }

            res.status(201).json({ message: "User successfully deleted"})
        } catch(error) {
            console.error("Delete Error: ", error);
            return res.status(500).json({ message: "User delete error"})  
        }
    });

router.post('/login', async (req, res) => {
    try{
        const { email, password } = req.body;
        console.log("1. Incoming data:", req.body);

        // Temp password check before hashing is implemented
        const user = await User.findOne({ email: email, password: password });
        console.log("2. Database result:", user);

        if (!user){
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        return res.json({ message: "Success", user: user.user_id });
    } catch(error) {
        console.error("Login Error: ", error);
        return res.status(500).json({ message: "User Login Error"})  
    }
})


module.exports = router;