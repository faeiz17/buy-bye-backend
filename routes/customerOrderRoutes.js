// routes/customerOrderRoutes.js
const express = require("express");
const router = express.Router();
const {
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  getOrderTracking,
} = require("../controllers/customerOrderController");
const { protectCustomer } = require("../middleware/authMiddleware");

// All routes are protected - require customer authentication
router.use(protectCustomer);

// @route   GET /api/customer/orders
// @desc    Get all orders for a customer
// @access  Private (customer)
router.get("/", getCustomerOrders);

// @route   GET /api/customer/orders/:id
// @desc    Get order details by ID
// @access  Private (customer)
router.get("/:id", getCustomerOrderById);

// @route   PUT /api/customer/orders/:id/cancel
// @desc    Cancel an order
// @access  Private (customer)
router.put("/:id/cancel", cancelCustomerOrder);

// @route   GET /api/customer/orders/:id/tracking
// @desc    Get order tracking details
// @access  Private (customer)
router.get("/:id/tracking", getOrderTracking);

module.exports = router;
