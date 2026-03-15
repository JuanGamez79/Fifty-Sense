const User = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserController = {
    // register a new user, return the user data and a JWT token for authentication
    register: async (req, res) => {
        try {
            const { email, password, first_name, last_name } = req.body;
            if (!email || !password || !first_name || !last_name) {
                return res.status(400).json({
                    status: 'failed',
                    data: [],
                    message: 'All required fields must be provided.',
                });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    status: 'failed',
                    data: [],
                    message: 'This email already exists, please log in instead.',
                });
            }

            // password hashed in userModel
            const newUser = await User.create({
                email,
                password,
                first_name,
                last_name,
            });

            const token = jwt.sign(
                {
                    mongo_id: newUser._id,
                    user_id: newUser.user_id,
                    email: newUser.email,
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const userData = {
                _id: newUser._id,
                user_id: newUser.user_id,
                email: newUser.email,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                date_created: newUser.date_created,
            };

            return res.status(201).json({
                status: 'success',
                data: [{ user: userData, token }],
                message: 'Your account has been successfully created.',
            });
        } catch (error) {
            console.error('Creation Error:', error);
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'Account creation error',
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    status: 'failed',
                    data: [],
                    message: 'Email and password are required.',
                });
            }

            // include password in the query result for authentication
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                return res.status(401).json({
                    status: 'failed',
                    data: [],
                    message: 'Invalid email or password. Please try again.',
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'failed',
                    data: [],
                    message: 'Invalid email or password. Please try again.',
                });
            }

            const token = jwt.sign(
                {
                    mongo_id: user._id,
                    user_id: user.user_id,
                    email: user.email,
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const userData = {
                _id: user._id,
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                date_created: user.date_created,
            };

            return res.status(200).json({
                status: 'success',
                data: [{ user: userData, token }],
                message: 'You have successfully logged in.',
            });
        } catch (error) {
            console.error('Login Error:', error);
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'User login error',
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.mongo_id);

            if (!user) {
                return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'User not found.',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [user],
                message: 'User profile retrieved successfully.',
            });
        } catch (error) {
            console.error('Profile Error:', error);
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'User profile error',
            });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);

            if (!deletedUser) {
                return res.status(404).json({
                    status: 'failed',
                    data: [],
                    message: 'User not found',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: [],
                message: 'User successfully deleted',
            });
        } catch (error) {
            console.error('Delete Error:', error);
            return res.status(500).json({
                status: 'failed',
                data: [],
                message: 'User delete error',
            });
        }
    },
};

module.exports = UserController;