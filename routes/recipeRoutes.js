// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const { generateRecipe } = require('../controllers/recipeController');
const { protectCustomer } = require('../middleware/authMiddleware');

// All routes are protected - require customer authentication
router.use(protectCustomer);

// @route   POST /api/recipe/generate
// @desc    Generate recipe from cart items
// @access  Private (customer)
router.post('/generate', generateRecipe);

module.exports = router; 