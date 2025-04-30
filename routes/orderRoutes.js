// routes/orderRoutes.js
const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const {
  createOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder,
  getOrderTracking,
  createDirectOrder,
} = require("../controllers/orderController");
const { protectCustomer } = require("../middleware/authMiddleware");

// All routes are protected - require customer authentication
router.use(protectCustomer);

// @route   POST /api/orders
// @desc    Create a new order from cart
// @access  Private (customer)
router.post(
  "/",
  [
    check("deliveryAddress", "Delivery address is required").notEmpty(),
    check("contactPhone", "Contact phone is required").notEmpty(),
    check("paymentMethod", "Payment method must be valid")
      .optional()
      .isIn(["cash_on_delivery", "online", "wallet"]),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createOrder
);

// @route   GET /api/orders
// @desc    Get all orders for the current customer
// @access  Private (customer)
router.get("/", getCustomerOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private (customer)
router.get("/:id", getOrderById);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private (customer)
router.put("/:id/cancel", cancelOrder);

// @route   GET /api/orders/:id/tracking
// @desc    Get order tracking details
// @access  Private (customer)
router.get("/:id/tracking", getOrderTracking);
// Add this route to your orderRoutes.js file

// @route   POST /api/orders/direct
// @desc    Create a new order directly (not from cart)
// @access  Private (customer)
router.post(
  "/direct",
  [
    check("items", "Order items are required").isArray().notEmpty(),
    check("deliveryAddress", "Delivery address is required").notEmpty(),
    check("contactPhone", "Contact phone is required").notEmpty(),
    check("paymentMethod", "Payment method must be valid")
      .optional()
      .isIn(["cash_on_delivery", "online", "wallet"]),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createDirectOrder
);
module.exports = router;
