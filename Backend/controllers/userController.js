const User = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/emailService');

const UserController = {
    register: async (req, res) => {
        try {
            const { email, password, first_name, last_name } = req.body;
            if (!email || !password || !first_name || !last_name) {
                return res.status(400).json({ status: 'failed', data: [], message: 'All required fields must be provided.' });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ status: 'failed', data: [], message: 'This email already exists, please log in instead.' });
            }
            const newUser = await User.create({ email, password, first_name, last_name });
            const token = jwt.sign(
                { mongo_id: newUser._id, user_id: newUser.user_id, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const userData = { _id: newUser._id, user_id: newUser.user_id, email: newUser.email, first_name: newUser.first_name, last_name: newUser.last_name, date_created: newUser.date_created };
            return res.status(201).json({ status: 'success', data: [{ user: userData, token }], message: 'Your account has been successfully created.' });
        } catch (error) {
            console.error('Creation Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'Account creation error' });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ status: 'failed', data: [], message: 'Email and password are required.' });
            }
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ status: 'failed', data: [], message: 'Invalid email or password. Please try again.' });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ status: 'failed', data: [], message: 'Invalid email or password. Please try again.' });
            }
            const token = jwt.sign(
                { mongo_id: user._id, user_id: user.user_id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const userData = { _id: user._id, user_id: user.user_id, email: user.email, first_name: user.first_name, last_name: user.last_name, date_created: user.date_created };
            return res.status(200).json({ status: 'success', data: [{ user: userData, token }], message: 'You have successfully logged in.' });
        } catch (error) {
            console.error('Login Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'User login error' });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.mongo_id);
            if (!user) {
                return res.status(404).json({ status: 'failed', data: [], message: 'User not found.' });
            }
            return res.status(200).json({ status: 'success', data: [user], message: 'User profile retrieved successfully.' });
        } catch (error) {
            console.error('Profile Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'User profile error' });
        }
    },

    // PUT /api/users/:id
    // Name update only: { first_name, last_name }
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;

            if (id !== req.user.mongo_id.toString()) {
                return res.status(403).json({ status: 'failed', data: [], message: 'You are not authorised to update this profile.' });
            }

            const { first_name, last_name } = req.body;

            if (!first_name?.trim() || !last_name?.trim()) {
                return res.status(400).json({ status: 'failed', data: [], message: 'First name and last name are required.' });
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { first_name: first_name.trim(), last_name: last_name.trim() },
                { new: true, runValidators: true }
            );
            if (!updatedUser) {
                return res.status(404).json({ status: 'failed', data: [], message: 'User not found.' });
            }

            const userData = { _id: updatedUser._id, user_id: updatedUser.user_id, email: updatedUser.email, first_name: updatedUser.first_name, last_name: updatedUser.last_name, date_created: updatedUser.date_created };
            return res.status(200).json({ status: 'success', data: [userData], message: 'Profile updated successfully.' });
        } catch (error) {
            console.error('Update Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'Profile update error' });
        }
    },

    // PUT /api/users/:id/email
    // Email update — kept separate so it never touches name validation.
    // Requires { email, current_password }.
    changeEmail: async (req, res) => {
        try {
            const { id } = req.params;

            if (id !== req.user.mongo_id.toString()) {
                return res.status(403).json({ status: 'failed', data: [], message: 'You are not authorised to update this profile.' });
            }

            const { email, current_password } = req.body;

            if (!email || !current_password) {
                return res.status(400).json({ status: 'failed', data: [], message: 'Email and current password are required.' });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ status: 'failed', data: [], message: 'Please provide a valid email address.' });
            }

            const userWithPw = await User.findById(id).select('+password');
            if (!userWithPw) {
                return res.status(404).json({ status: 'failed', data: [], message: 'User not found.' });
            }

            const passwordValid = await bcrypt.compare(current_password, userWithPw.password);
            if (!passwordValid) {
                return res.status(401).json({ status: 'failed', data: [], message: 'Incorrect password. Email not updated.' });
            }

            const emailTaken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
            if (emailTaken) {
                return res.status(400).json({ status: 'failed', data: [], message: 'That email address is already in use.' });
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { email: email.toLowerCase().trim() },
                { new: true, runValidators: true }
            );

            const userData = { _id: updatedUser._id, user_id: updatedUser.user_id, email: updatedUser.email, first_name: updatedUser.first_name, last_name: updatedUser.last_name, date_created: updatedUser.date_created };
            return res.status(200).json({ status: 'success', data: [userData], message: 'Email updated successfully.' });
        } catch (error) {
            console.error('Change Email Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'Email update error' });
        }
    },

    // PUT /api/users/:id/password
    changePassword: async (req, res) => {
        try {
            const { id } = req.params;

            if (id !== req.user.mongo_id.toString()) {
                return res.status(403).json({ status: 'failed', data: [], message: 'You are not authorised to change this password.' });
            }

            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({ status: 'failed', data: [], message: 'Current password and new password are required.' });
            }

            if (new_password.length < 8) {
                return res.status(400).json({ status: 'failed', data: [], message: 'New password must be at least 8 characters.' });
            }

            const user = await User.findById(id).select('+password');
            if (!user) {
                return res.status(404).json({ status: 'failed', data: [], message: 'User not found.' });
            }

            const isValid = await bcrypt.compare(current_password, user.password);
            if (!isValid) {
                return res.status(401).json({ status: 'failed', data: [], message: 'Current password is incorrect.' });
            }

            if (current_password === new_password) {
                return res.status(400).json({ status: 'failed', data: [], message: 'New password must differ from your current password.' });
            }

            user.password = new_password;
            await user.save();

            return res.status(200).json({ status: 'success', data: [], message: 'Password changed successfully.' });
        } catch (error) {
            console.error('Change Password Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'Password change error' });
        }
    },
forgotPassword: async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: 'failed', data: [], message: 'Email is required.' });
        }

        const user = await User.findOne({ email });

        // Always return success — never reveal whether the email exists
        if (!user) {
            return res.status(200).json({ status: 'success', data: [], message: 'Reset link sent if account exists.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        user.reset_token = token;
        user.reset_token_expires = expires;
        await user.save();

        console.log('✅ Token saved, attempting email to:', user.email);

        await sendResetEmail(user.email, token);
        console.log('✅ Email sent successfully'); 

        return res.status(200).json({ status: 'success', data: [], message: 'Reset link sent if account exists.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(500).json({ status: 'failed', data: [], message: 'Error processing password reset request.' });
    }
},

// POST /api/users/reset-password
resetPassword: async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ status: 'failed', data: [], message: 'Token and new password are required.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ status: 'failed', data: [], message: 'Password must be at least 8 characters.' });
        }

        const user = await User.findOne({
            reset_token: token,
            reset_token_expires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ status: 'failed', data: [], message: 'Invalid or expired reset token.' });
        }

        user.password = password;        // pre-save hook hashes it automatically
        user.reset_token = null;
        user.reset_token_expires = null;
        await user.save();

        return res.status(200).json({ status: 'success', data: [], message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ status: 'failed', data: [], message: 'Error resetting password.' });
    }
},
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(404).json({ status: 'failed', data: [], message: 'User not found' });
            }
            return res.status(200).json({ status: 'success', data: [], message: 'User successfully deleted' });
        } catch (error) {
            console.error('Delete Error:', error);
            return res.status(500).json({ status: 'failed', data: [], message: 'User delete error' });
        }
    },
};

module.exports = UserController;