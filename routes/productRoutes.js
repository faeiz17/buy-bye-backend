const express = require("express");
const router = express.Router();
const {
  listProducts,
  getProductById,
  listProductsByCategory,
  listProductsBySubCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} = require("../controllers/productController");
const { protectAdmin } = require("../middleware/authMiddleware");

// Public
router.get("/", listProducts);
router.get("/category/:categoryId", listProductsByCategory);
router.get("/sub-category/:subCategoryId", listProductsBySubCategory);
router.get("/:id", getProductById);
router.get("/search/:keyword", searchProducts);

// Protected
router.post("/", protectAdmin, createProduct);
router.put("/:id", protectAdmin, updateProduct);
router.delete("/:id", protectAdmin, deleteProduct);

module.exports = router;
