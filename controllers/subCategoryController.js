const SubCategory = require("../models/SubCategory");

// @desc    List all sub-categories
// @route   GET /api/subcategories
// @access  Public
exports.listSubCategories = async (req, res) => {
  try {
    const subs = await SubCategory.find().sort("name");
    res.json(subs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching sub-categories", error: err.message });
  }
};

// @desc    List sub-categories for a specific category
// @route   GET /api/subcategories/by-category/:categoryId
// @access  Public
exports.listSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subs = await SubCategory.find({ category: categoryId }).sort("name");
    res.json(subs);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching sub-categories by category",
      error: err.message,
    });
  }
};

// @desc    Get a single sub-category by ID
// @route   GET /api/subcategories/:id
// @access  Public
exports.getSubCategoryById = async (req, res) => {
  try {
    const sub = await SubCategory.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    res.json(sub);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching sub-category", error: err.message });
  }
};

// @desc    Create a new sub-category
// @route   POST /api/subcategories
// @access  Private
exports.createSubCategory = async (req, res) => {
  try {
    const { name, category, food_reciepe } = req.body;
    if (!name || !category) {
      return res
        .status(400)
        .json({ message: "Name and parent category ID are required" });
    }
    const sub = new SubCategory({
      name,
      category,
      food_reciepe: food_reciepe === 1 ? 1 : 0,
    });
    const saved = await sub.save();
    res.status(201).json(saved);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating sub-category", error: err.message });
  }
};

// @desc    Update an existing sub-category
// @route   PUT /api/subcategories/:id
// @access  Private
exports.updateSubCategory = async (req, res) => {
  try {
    const { name, category, food_reciepe } = req.body;
    const updated = await SubCategory.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(food_reciepe !== undefined && { food_reciepe }),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating sub-category", error: err.message });
  }
};

// @desc    Delete a sub-category by ID
// @route   DELETE /api/subcategories/:id
// @access  Private
exports.deleteSubCategory = async (req, res) => {
  try {
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    res.json({ message: "Sub-category deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting sub-category", error: err.message });
  }
};
