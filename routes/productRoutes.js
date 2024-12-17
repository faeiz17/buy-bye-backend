const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController"); // Adjust the path as needed
const { protect } = require("../middleware/authMiddleware"); // Middleware for authentication

// Public route to fetch all products
router.get("/", getAllProducts);

// Public route to fetch a specific product by ID
router.get("/:id", getProductById);

// Private route to create a product
router.post("/", protect, createProduct);

// Private route to update a product
router.put("/:id", protect, updateProduct);

// Private route to delete a product
router.delete("/:id", protect, deleteProduct);

module.exports = router;
