const express = require("express");
const router = express.Router();
const {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protectAdmin } = require("../middleware/authMiddleware");

// Public: list all categories
router.get("/", listCategories);

// Public: get a single category by ID
router.get("/:id", getCategoryById);

// Private: create a new category
router.post("/", protectAdmin, createCategory);

// Private: update an existing category
router.put("/:id", protectAdmin, updateCategory);

// Private: delete a category
router.delete("/:id", protectAdmin, deleteCategory);

module.exports = router;
