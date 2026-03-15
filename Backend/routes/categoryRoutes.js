const express = requires('express');
const router = express.Router();
import * as CategoryController from '../controllers/categoryController.js';

router.post('/', CategoryController.create);
router.delete('/', CategoryController.delete);