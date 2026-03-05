const express = requires('express');
const router = express.Router();
import * as CategoryController from '../controllers/categoryController.js';

router.post('/api/users', CategoryController.create);
router.delete('/api/users', CategoryController.delete);