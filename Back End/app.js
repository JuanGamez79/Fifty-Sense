require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const User = require('./models/Users').default;
const Account = require('./models/Accounts').default;
const Transaction = require('./models/Transactions').default;
const Category = require('./models/Categories').default;
const Budget = require('./models/Budgets').default;
const Goal = require('./models/Goals').default;

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 5000;

// Connect to the Database
async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

// -----Separated into routes and controllers-----------

// Insert new User
app.post('/api/users', async (req, res) => {
    try{
        const newUser = await User.create(req.body);
        res.status(201).send(newUser);
    } catch (error){
        res.status(400).json({ message: error.message });
    }
})

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try{
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if(!deletedUser){
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error){
        res.status(500).json({ message: error.message });
    }
})

// Insert new Account
app.post('/api/accounts', async (req, res) => {
    try {
        const newAccount = await Account.create(req.body);
        res.status(201).send(newAccount);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an Account
app.delete('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAccount = await Account.findByIdAndDelete(id);
        
        if (!deletedAccount) {
            return res.status(404).json({ message: "Account not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Insert new Transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const newTransaction = await Transaction.create(req.body);
        res.status(201).send(newTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a Transaction (might not be needed)
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTransaction = await Transaction.findByIdAndDelete(id);
        if (!deletedTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Insert new Category
app.post('/api/categories', async (req, res) => {
    try{
        const newCategory = await Category.create(req.body);
        res.status(201).send(newCategory);
    } catch (error){
        res.status(400).json({ message: error.message });
    }
})

// Delete a Category
app.delete('/api/categories/:id', async (req, res) => {
    try{
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory){
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(204).send();
    } catch (error){
        res.status(500).json({ message: error.message });
    }
})

// Insert new Budget
app.post('/api/budgets', async (req, res) => {
    try {
        const newBudget = await Budget.create(req.body);
        res.status(201).send(newBudget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a Budget
app.delete('/api/budgets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBudget = await Budget.findByIdAndDelete(id);
        
        if (!deletedBudget) {
            return res.status(404).json({ message: "Budget not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Insert new Goal
app.post('/api/goals', async (req, res) => {
    try {
        const newGoal = await Goal.create(req.body);
        res.status(201).send(newGoal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a Goal
app.delete('/api/goals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedGoal = await Goal.findByIdAndDelete(id);
        
        if (!deletedGoal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Retrieve all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find(); 
        res.status(200).json(users); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Retrieve a specific user

// Retrieve all transactions

// Retrieve a specific transaction