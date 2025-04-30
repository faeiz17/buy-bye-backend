const express = require("express");
const router = express.Router();
const {
  listSubCategories,
  getSubCategoryById,
  listSubCategoriesByCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoryController");
const { protectAdmin } = require("../middleware/authMiddleware");

// 🟢 Public Routes

// 1. Get all sub-categories
router.get("/", listSubCategories);

// 2. Get sub-categories by parent category ID
router.get("/by-category/:categoryId", listSubCategoriesByCategory);

// 3. Get single sub-category by its own ID
router.get("/:id", getSubCategoryById);

// 🔒 Private Routes (require auth)

// 4. Create a new sub-category
router.post("/", protectAdmin, createSubCategory);

// 5. Update an existing sub-category
router.put("/:id", protectAdmin, updateSubCategory);

// 6. Delete a sub-category
router.delete("/:id", protectAdmin, deleteSubCategory);

module.exports = router;
