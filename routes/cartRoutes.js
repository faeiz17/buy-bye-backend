// routes/cartRoutes.js
const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const { protectCustomer } = require("../middleware/authMiddleware");

// All routes are protected - require customer authentication
router.use(protectCustomer);

// @route   GET /api/cart
// @desc    Get customer's cart
// @access  Private (customer)
router.get("/", getCart);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private (customer)
router.post(
  "/",
  [
    check("vendorProductId", "Vendor product ID is required").notEmpty(),
    check("quantity", "Quantity must be a positive number")
      .optional()
      .isInt({ min: 1 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  addToCart
);

// @route   PUT /api/cart/:vendorProductId
// @desc    Update cart item quantity
// @access  Private (customer)
router.put(
  "/:vendorProductId",
  [check("quantity", "Quantity must be a positive number").isInt({ min: 1 })],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateCartItem
);

// @route   DELETE /api/cart/:vendorProductId
// @desc    Remove item from cart
// @access  Private (customer)
router.delete("/:vendorProductId", removeCartItem);

// @route   DELETE /api/cart
// @desc    Clear cart (remove all items)
// @access  Private (customer)
router.delete("/", clearCart);

module.exports = router;
