const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const bcrypt = require('bcrypt');


router.post('/register', async (req, res) => {
        try{
            const { user_id, email, password, first_name, last_name } = req.body;

            const newUser = new User({
                user_id, 
                email, 
                password, 
                first_name, 
                last_name,
            })

            const existingUser = await User.findOne({ email });
            if (existingUser){
                return res.status(400).json({
                    status: "failed",
                    data: [],
                    message: "This user already exists, please log in instead.",
                })
            }

            // Create() does the same thing as save(), except you don't have to make a local variable for the newUser
            // const newUser = await User.create({
            //     user_id, email, password, first_name, last_name,
            // });

            const savedUser = await newUser.save(); 
            const { role, ...user_data } = savedUser._doc;
            res.status(200).json({
                status: "success",
                data: [user_data],
                message:
                    "Thank you for registering with us. Your account has been successfully created.",
            });
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
        const { email } = req.body;
        console.log("1. Incoming data:", req.body);

        // Temp password check before hashing is implemented
        const user = await User.findOne({ email: email }).select("+password");
        console.log("2. Database result:", user);

        if (!user){
            return res.status(401).json({
                status: "failed",
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            });        
        }

        const isPasswordValid = await bcrypt.compare(
            `${req.body.password}`,
            user.password
        );

        if (!isPasswordValid)
            return res.status(401).json({
                status: "failed",
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            });
        // return user info except password
        const { password, ...user_data } = user._doc;

        res.status(200).json({
            status: "success",
            data: [user_data],
            message: "You have successfully logged in.",
        });
    } catch(error) {
        console.error("Login Error: ", error);
        return res.status(500).json({ message: "User Login Error"})  
    }
})


module.exports = router;