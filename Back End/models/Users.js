const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Settings info should be saved in Users if required

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: "User ID is required" },
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
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