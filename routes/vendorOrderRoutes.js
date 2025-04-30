// routes/vendorOrderRoutes.js
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  getVendorOrders,
  getVendorOrderById,
  updateOrderStatus,
  getOrderStats,
} = require("../controllers/vendorOrderController");
const { protectVendor } = require("../middleware/authMiddleware");

// All routes are protected - require vendor authentication
router.use(protectVendor);

// @route   GET /api/vendor/orders
// @desc    Get all orders for a vendor
// @access  Private (vendor)
router.get("/", getVendorOrders);

// @route   GET /api/vendor/orders/stats
// @desc    Get order statistics for a vendor
// @access  Private (vendor)
router.get("/stats", getOrderStats);

// @route   GET /api/vendor/orders/:id
// @desc    Get order details by ID
// @access  Private (vendor)
router.get("/:id", getVendorOrderById);

// @route   PUT /api/vendor/orders/:id/status
// @desc    Update order status
// @access  Private (vendor)
router.put(
  "/:id/status",
  [
    check("status", "Valid status is required").isIn([
      "pending",
      "processing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ]),
  ],
  updateOrderStatus
);

module.exports = router;
