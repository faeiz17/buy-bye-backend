// C:\Users\faeiz\Desktop\buy-bye-backend\server\controllers\customerOrderController.js
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const Customer = require("../models/Customer");
const { sendPushNotification } = require('./notificationController');
// @desc    Get all orders for a customer
// @route   GET /api/customer/orders
// @access  Private (customer)
exports.getCustomerOrders = asyncHandler(async (req, res) => {
  const customerId = req.customer.id;

  // Get all orders for this customer
  const orders = await Order.find({ customer: customerId })
    .populate("customer", "name email phone")
    .populate({
      path: "items.product",
      select: "title imageUrl",
    })
    .populate({
      path: "items.vendor",
      select: "name location",
    })
    .sort({ createdAt: -1 });

  res.json({ orders });
});

// @desc    Get order details by ID
// @route   GET /api/customer/orders/:id
// @access  Private (customer)
exports.getCustomerOrderById = asyncHandler(async (req, res) => {
  const customerId = req.customer.id;
  const orderId = req.params.id;

  const order = await Order.findOne({
    _id: orderId,
    customer: customerId,
  })
    .populate("customer", "name email phone")
    .populate({
      path: "items.product",
      select: "title imageUrl",
    })
    .populate({
      path: "items.vendor",
      select: "name location",
    });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

// @desc    Cancel an order
// @route   PUT /api/customer/orders/:id/cancel
// @access  Private (customer)
exports.cancelCustomerOrder = asyncHandler(async (req, res) => {
  const customerId = req.customer.id;
  const orderId = req.params.id;

  // Fix the destructuring to handle the nested structure
  const { reason } = req.body;
  let cancelReason = "Cancelled by customer";

  // Safely extract the string reason from potentially nested objects
  if (reason) {
    if (typeof reason === "string") {
      cancelReason = reason;
    } else if (reason.reason && typeof reason.reason === "string") {
      cancelReason = reason.reason;
    }
  }

  const order = await Order.findOne({
    _id: orderId,
    customer: customerId,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Only allow cancellation of pending or processing orders
  if (!["pending", "processing"].includes(order.status)) {
    return res.status(400).json({
      message: `Cannot cancel an order that is already ${order.status}`,
    });
  }

  // Update order status
  order.status = "cancelled";

  // Add to status history with the string reason
  order.statusHistory.push({
    status: "cancelled",
    timestamp: Date.now(),
    note: cancelReason,
  });

  await order.save();
    await sendPushNotification(
      req.customer.id,
      'Order Placed Successfully',
      `Your order #${order.orderNumber} your order status is ${order.status}`,
      { type: 'order', orderId: order._id.toString() }
    );

  res.json({
    message: "Order cancelled successfully",
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusHistory: order.statusHistory,
    },
  });
});
// @desc    Get order tracking details
// @route   GET /api/customer/orders/:id/tracking
// @access  Private (customer)
exports.getOrderTracking = asyncHandler(async (req, res) => {
  const customerId = req.customer.id;
  const orderId = req.params.id;

  const order = await Order.findOne({
    _id: orderId,
    customer: customerId,
  }).select(
    "orderNumber status statusHistory estimatedDelivery actualDelivery createdAt"
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    statusHistory: order.statusHistory,
    estimatedDelivery: order.estimatedDelivery,
    actualDelivery: order.actualDelivery,
    createdAt: order.createdAt,
  });
});

module.exports = exports;
