const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Settings info should be saved in Users if required

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String },
    date_created: { type: Date, default: Date.now }
});

// Should hash passwords before being saved to the DB
userSchema.pre("save", function (next) {
    const user = this;

    if (!user.isModified("password")) return next();
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

const User = mongoose.model("User", userSchema);
module.exports = User;