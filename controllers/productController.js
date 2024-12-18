const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");
// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      imageURL,
      basePrice,
      discountedPrice,
      category,
      vendor,
      qualityScore,
      featureProducts,
    } = req.body;

    // Validate request body
    if (
      !name ||
      !description ||
      !imageURL ||
      !basePrice ||
      !category ||
      !vendor ||
      !qualityScore ||
      !featureProducts
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create product
    const product = new Product({
      name,
      description,
      imageURL,
      basePrice,
      discountedPrice,
      category,
      vendor,
      qualityScore,
      featureProducts,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    // Extract query parameters
    const {
      category,
      name,
      qualityScore,
      basePriceMin,
      basePriceMax,
      featureProducts,
    } = req.query;

    // Create a dynamic filter object
    const filter = {};

    if (category) {
      filter.category = category; // Exact match for category
    }

    if (name) {
      filter.name = new RegExp(name, "i"); // Case-insensitive partial match for name
    }

    if (qualityScore) {
      filter.qualityScore = { $eq: parseFloat(qualityScore) }; // Minimum quality score
    }

    if (basePriceMin || basePriceMax) {
      filter.basePrice = {};
      if (basePriceMin) filter.basePrice.$gte = parseFloat(basePriceMin); // Minimum base price
      if (basePriceMax) filter.basePrice.$lte = parseFloat(basePriceMax); // Maximum base price
    }
    // Filter by featureProducts if it is provided in the query
    if (featureProducts !== undefined) {
      filter.featureProducts = featureProducts === "true";
    }

    // Fetch products with populated vendor details
    const products = await Product.find(filter).populate(
      "vendor",
      "name email contact"
    );

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "vendor",
      "storeName"
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated product
      runValidators: true, // Ensure validation rules are applied
    });

    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct)
      return res.status(404).json({ error: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getCategoryNames = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category", // Group by category
          imageURL: { $first: "$imageURL" }, // Pick the first imageURL for the category
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default `_id` field
          category: "$_id", // Rename `_id` to `category`
          imageURL: 1, // Include imageURL
        },
      },
    ]);

    res.status(200) ? console.log("success") : console.log("error");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
