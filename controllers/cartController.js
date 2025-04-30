// controllers/cartController.js
const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const VendorProduct = require("../models/VendorProduct");

// @desc    Get current customer's cart
// @route   GET /api/cart
// @access  Private (customer)
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ customer: req.customer.id }).populate({
    path: "items.vendorProduct",
    populate: [
      {
        path: "product",
        select: "title price imageUrl",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      },
      {
        path: "vendor",
        select: "name location",
      },
    ],
  });

  // If no cart exists yet, create an empty one
  if (!cart) {
    cart = new Cart({ customer: req.customer.id, items: [] });
    await cart.save();
  }

  res.json(cart);
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private (customer)
exports.addToCart = asyncHandler(async (req, res) => {
  const { vendorProductId, quantity = 1 } = req.body;

  // Validate input
  if (!vendorProductId) {
    return res.status(400).json({ message: "Vendor product ID is required" });
  }

  // Check if vendor product exists and is in stock
  const vendorProduct = await VendorProduct.findById(vendorProductId);
  if (!vendorProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!vendorProduct.inStock) {
    return res.status(400).json({ message: "Product is out of stock" });
  }

  // Find or create cart
  let cart = await Cart.findOne({ customer: req.customer.id });
  if (!cart) {
    cart = new Cart({ customer: req.customer.id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.vendorProduct.toString() === vendorProductId
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    cart.items[existingItemIndex].quantity += parseInt(quantity);
  } else {
    // Add new item
    cart.items.push({
      vendorProduct: vendorProductId,
      quantity: parseInt(quantity),
    });
  }

  cart.lastUpdated = Date.now();
  await cart.save();

  // Return the populated cart
  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.vendorProduct",
    populate: [
      {
        path: "product",
        select: "title price imageUrl",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      },
      {
        path: "vendor",
        select: "name location",
      },
    ],
  });

  res.status(200).json(populatedCart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:vendorProductId
// @access  Private (customer)
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { vendorProductId } = req.params;
  const { quantity } = req.body;

  // Validate input
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  // Find cart
  const cart = await Cart.findOne({ customer: req.customer.id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  // Find item in cart
  const itemIndex = cart.items.findIndex(
    (item) => item.vendorProduct.toString() === vendorProductId
  );

  if (itemIndex === -1) {
    return res.status(404).json({ message: "Item not found in cart" });
  }

  // Update quantity
  cart.items[itemIndex].quantity = parseInt(quantity);
  cart.lastUpdated = Date.now();
  await cart.save();

  // Return the populated cart
  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.vendorProduct",
    populate: [
      {
        path: "product",
        select: "title price imageUrl",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      },
      {
        path: "vendor",
        select: "name location",
      },
    ],
  });

  res.status(200).json(populatedCart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:vendorProductId
// @access  Private (customer)
exports.removeCartItem = asyncHandler(async (req, res) => {
  const { vendorProductId } = req.params;

  // Find cart
  const cart = await Cart.findOne({ customer: req.customer.id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  // Remove item
  cart.items = cart.items.filter(
    (item) => item.vendorProduct.toString() !== vendorProductId
  );

  cart.lastUpdated = Date.now();
  await cart.save();

  // Return the populated cart
  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.vendorProduct",
    populate: [
      {
        path: "product",
        select: "title price imageUrl",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      },
      {
        path: "vendor",
        select: "name location",
      },
    ],
  });

  res.status(200).json(populatedCart);
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private (customer)
exports.clearCart = asyncHandler(async (req, res) => {
  // Find cart
  const cart = await Cart.findOne({ customer: req.customer.id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  // Clear items
  cart.items = [];
  cart.lastUpdated = Date.now();
  await cart.save();

  res.status(200).json({ message: "Cart cleared", cart });
});

module.exports = exports;
