require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// const accountRoutes = require('./routes/accountRoutes');
// app.use('/api/accounts', accountRoutes);

const swaggerUIPath= require("swagger-ui-express");
const swaggerjsonFilePath = require("./swagger/docs/swagger.json");
app.use("/api-docs", swaggerUIPath.serve, swaggerUIPath.setup(swaggerjsonFilePath));

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;


// Connect to the Database
mongoose.connect(uri)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));


// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Budgeting App API',
//       version: '1.0.0',
//       description: 'API documentation',
//     },
//     servers: [
//       {
//         url: 'http://localhost:3000',
//       },
//     ],
//   },
//   apis: ['./routes/*.js'], 
// };

// const swaggerSpec = swaggerJSDoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerjsonFilePath));


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});

