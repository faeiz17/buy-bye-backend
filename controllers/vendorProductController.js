// controllers/vendorProductController.js
const asyncHandler = require("express-async-handler");
const VendorProduct = require("../models/VendorProduct");

// @desc    Create or update (upsert) a vendor’s product
// @route   POST /api/vendor-products
// @access  Private (vendor)
exports.upsertVendorProduct = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  let { product, discountType, discountValue, inStock } = req.body;

  if (!product) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  discountValue = Number(discountValue) || 0;

  // find existing
  let vp = await VendorProduct.findOne({ vendor: vendorId, product });

  if (vp) {
    // update fields
    if (discountType !== undefined) vp.discountType = discountType;
    if (discountValue !== undefined) vp.discountValue = discountValue;
    if (inStock !== undefined) vp.inStock = inStock;
    await vp.save();

    // populate without execPopulate
    vp = await vp.populate("product", "title price imageUrl");
    return res.json(vp);
  }

  // create new listing
  vp = new VendorProduct({
    vendor: vendorId,
    product,
    discountType: discountType || null,
    discountValue,
    inStock: inStock !== undefined ? inStock : true,
  });
  await vp.save();

  vp = await vp.populate("product", "title price imageUrl");
  res.status(201).json(vp);
});

// @desc    List all products this vendor carries
// @route   GET /api/vendor-products
// @access  Private (vendor)
exports.listVendorProducts = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const items = await VendorProduct.find({ vendor: vendorId }).populate({
    path: "product",
    select: "title price imageUrl category subCategory",
    populate: [
      { path: "category", select: "name" },
      { path: "subCategory", select: "name" },
    ],
  });
  res.json(items);
});

// @desc    Get one vendor product by its ID
// @route   GET /api/vendor-products/:id
// @access  Private (vendor)
exports.getVendorProductById = asyncHandler(async (req, res) => {
  const vp = await VendorProduct.findById(req.params.id).populate(
    "product",
    "title price imageUrl"
  );
  if (req.vendor && vp.vendor._id.toString() !== req.vendor._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }
  res.json(vp);
});
// Add this function to controllers/vendorProductController.js

// @desc    Get products from a specific vendor with filtering options
// @route   GET /api/vendor-products/by-vendor/:vendorId
// @access  Public
exports.getVendorProductsByFilters = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;
  const { categoryId, subCategoryId, sortBy = 'popular' } = req.query;

  // Validate vendor ID
  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  // Base query to get all products from this vendor
  let query = { vendor: vendorId, inStock: true };

  // Set up populate options with category filters
  const populateOptions = [
    { path: "vendor", select: "name location" },
    {
      path: "product",
      select: "title price imageUrl category subCategory description",
      populate: [
        { path: "category", select: "name" },
        { path: "subCategory", select: "name" },
      ],
    },
  ];

  // Apply category filter if provided
  if (categoryId) {
    populateOptions[1].match = { category: categoryId };
  }

  // Apply subcategory filter if provided
  if (subCategoryId) {
    populateOptions[1].match = {
      ...(populateOptions[1].match || {}),
      subCategory: subCategoryId,
    };
  }

  // Find vendor products with filters
  let products = await VendorProduct.find(query)
    .populate(populateOptions);

  // Filter out products that didn't match category/subcategory filters
  products = products.filter((p) => p.product !== null);

  // Sort products based on sortBy parameter
  if (sortBy === 'cheapest') {
    // Sort by price low to high
    products.sort((a, b) => {
      const priceA = extractPrice(a.product.price);
      const priceB = extractPrice(b.product.price);
      return priceA - priceB;
    });
  } else if (sortBy === 'expensive') {
    // Sort by price high to low
    products.sort((a, b) => {
      const priceA = extractPrice(a.product.price);
      const priceB = extractPrice(b.product.price);
      return priceB - priceA;
    });
  } else {
    // Default: sort by popularity/featured
    // You can implement your own popularity logic here
    // For now, just use the default order
  }

  // Utility function to extract price
  function extractPrice(price) {
    if (typeof price === 'number') return price;
    const matches = String(price).match(/\d+/g);
    return matches ? parseInt(matches.join(''), 10) : 0;
  }

  res.json(products);
});
// @desc    Update a vendor’s product by its ID
// @route   PUT /api/vendor-products/:id
// @access  Private (vendor)
exports.updateVendorProduct = asyncHandler(async (req, res) => {
  const vp = await VendorProduct.findById(req.params.id);
  if (!vp || vp.vendor.toString() !== req.vendor._id.toString()) {
    return res.status(404).json({ message: "Vendor product not found" });
  }

  let { discountType, discountValue, inStock } = req.body;
  if (discountType !== undefined) vp.discountType = discountType;
  if (discountValue !== undefined) vp.discountValue = Number(discountValue);
  if (inStock !== undefined) vp.inStock = inStock;

  await vp.save();

  const populated = await vp.populate("product", "title price imageUrl");
  res.json(populated);
});

// @desc    Delete a vendor’s product by its ID
// @route   DELETE /api/vendor-products/:id
// @access  Private (vendor)
exports.deleteVendorProduct = asyncHandler(async (req, res) => {
  const vp = await VendorProduct.findById(req.params.id);
  if (!vp || vp.vendor.toString() !== req.vendor._id.toString()) {
    return res.status(404).json({ message: "Vendor product not found" });
  }

  // deleteOne in place of remove()
  await vp.deleteOne();
  res.json({ message: "Vendor product removed" });
});
