const express = require('express');
const router = express.Router();
const User = require('../models/Users');


router.post('/', async (req, res) => {
        try{
            const newUser = await User.create(req.body);
            res.status(201).send(newUser);
        } catch(error) {
            return res.status(500).json({ message: "Error"})  
        }
    });
    
router.delete('/:id', async (req, res) => {
        try{
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);

            if(!deletedUser){
                return res.status(404).json({ message: "User not found" });
            }
        } catch(error) {
            return res.status(500).json({ message: "Error"})  
        }
    });

router.post('/login', async (req, res) => {
    try{
        const { email, password} = req.body;

        const user = await User.find(u => u.email === email && u.password === password);

        if (!user){
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        res.json({ message: "Success", user: user.user_id });
    } catch(error) {
        return res.status(500).json({ message: "User Login Error"})  
    }
})


module.exports = router;