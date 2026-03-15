const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Settings info should be saved in Users if required

const userSchema = new mongoose.Schema({
    user_id: { type: String, default: () => crypto.randomUUID() },
    first_name: { type: String, required: 'First name is required', trim: true },
    last_name: { type: String, required: 'Last name is required', trim: true },
    email: { type: String, required: 'Email is required', unique: true, lowercase: true, trim: true },
    password: { type: String, required: 'Password is required', select: false },
    date_created: { type: Date, default: Date.now }
});

// Hash the password before saving the user to the database
userSchema.pre("save", async function () {
    const user = this;

    if (!user.isModified("password")) return;

    try {
        const salt = await bcrypt.genSalt(10);
        
        const hash = await bcrypt.hash(user.password, salt);
        
        user.password = hash;

    } catch (error) {
        throw error; 
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;