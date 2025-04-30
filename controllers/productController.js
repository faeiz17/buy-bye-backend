const Product = require("../models/Product");

// @desc    List all products (with category + subCategory names)
// @route   GET /api/products
// @access  Public
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .populate("subCategory", "name");
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: err.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("subCategory", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: err.message });
  }
};

// @desc    List products by Category ID
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.listProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId })
      .populate("category", "name")
      .populate("subCategory", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching products by category",
      error: err.message,
    });
  }
};

// @desc    List products by SubCategory ID
// @route   GET /api/products/sub-category/:subCategoryId
// @access  Public
exports.listProductsBySubCategory = async (req, res) => {
  try {
    const products = await Product.find({
      subCategory: req.params.subCategoryId,
    })
      .populate("category", "name")
      .populate("subCategory", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching products by sub-category",
      error: err.message,
    });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    const { title, price, imageUrl, category, subCategory } = req.body;
    if (!title || !price || !imageUrl || !category || !subCategory) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const product = new Product({
      title,
      price,
      imageUrl,
      category,
      subCategory,
    });
    const saved = await product.save();
    const populated = await saved
      .populate("category", "name")
      .populate("subCategory", "name")
      .execPopulate();
    res.status(201).json(populated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating product", error: err.message });
  }
};

// @desc    Update a product by ID
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const updates = (({ title, price, imageUrl, category, subCategory }) => ({
      ...(title !== undefined && { title }),
      ...(price !== undefined && { price }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(category !== undefined && { category }),
      ...(subCategory !== undefined && { subCategory }),
    }))(req.body);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating product", error: err.message });
  }
};

// @desc    Delete a product by ID
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: err.message });
  }
};

// @desc    Search products by keyword in title
// @route   GET /api/products/search/:keyword
// @access  Public
exports.searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;
    const products = await Product.find({
      title: { $regex: keyword, $options: "i" },
    })
      .populate("category", "name")
      .populate("subCategory", "name");
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error searching products", error: err.message });
  }
};
