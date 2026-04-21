require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.1.11:5173', 'https://fiftysense.unearned.duckdns.org'], 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200 
};  

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.disable("x-powered-by");
app.set('trust proxy', 1);

// Root route for health checks
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Budgeting App API is running' });
});


const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const accountRoutes = require('./routes/accountRoutes');
app.use('/api/accounts', accountRoutes);

const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);

const budgetRoutes = require('./routes/budgetRoutes');
app.use('/api/budgets', budgetRoutes);

const goalRoutes = require('./routes/goalRoutes');
app.use('/api/goals', goalRoutes);

const swaggerUIPath= require("swagger-ui-express");
const swaggerjsonFilePath = require("./swagger/docs/swagger.json");
app.use("/api-docs", swaggerUIPath.serve, swaggerUIPath.setup(swaggerjsonFilePath));

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 3006;


// Connect to the Database
mongoose.connect(uri)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));


// 404 handler - return JSON not HTML
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler middleware - ensure all errors return JSON
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger docs available at http://backend.unearned.duckdns.org/api-docs`);
});

