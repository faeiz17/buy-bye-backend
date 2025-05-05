// C:\Users\faeiz\Desktop\buy-bye-backend\server\controllers\vendorOrderController.js
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const { sendPushNotification } = require('./notificationController');

// @desc    Get all orders for a vendor
// @route   GET /api/vendor/orders
// @access  Private (vendor)
exports.getVendorOrders = asyncHandler(async (req, res) => {
  const vendorId = req.vendor.id;

  // Get orders where this vendor has at least one item
  const orders = await Order.find({
    "items.vendor": vendorId,
  })
    .populate("customer", "name email phone")
    .populate("items.product", "title imageUrl")
    .sort({ createdAt: -1 });

  // Filter order items to only include those from this vendor
  const filteredOrders = orders.map((order) => {
    // Create a copy of the order document
    const orderObject = order.toObject();

    // Filter items to only include those from this vendor
    orderObject.items = orderObject.items.filter(
      (item) => item.vendor && item.vendor.toString() === vendorId
    );

    // Recalculate subtotal and total for this vendor's items only
    orderObject.subtotal = orderObject.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return orderObject;
  });

  res.json(filteredOrders);
});

// @desc    Get order details by ID
// @route   GET /api/vendor/orders/:id
// @access  Private (vendor)
exports.getVendorOrderById = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const vendorId = req.vendor.id;

  const order = await Order.findById(orderId)
    .populate("customer", "name email phone")
    .populate("items.product", "title imageUrl")
    .populate("items.vendor", "name location");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Check if this vendor has any items in the order
  const hasVendorItems = order.items.some(
    (item) => item.vendor && item.vendor._id.toString() === vendorId
  );

  if (!hasVendorItems) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view this order" });
  }

  // Create a copy of the order and filter items
  const orderObject = order.toObject();

  // Filter items to only include those from this vendor
  orderObject.items = orderObject.items.filter(
    (item) => item.vendor && item.vendor._id.toString() === vendorId
  );

  // Recalculate subtotal for this vendor's items only
  orderObject.subtotal = orderObject.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  res.json(orderObject);
});

// @desc    Update order status
// @route   PUT /api/vendor/orders/:id/status
// @access  Private (vendor)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  const vendorId = req.vendor.id;

  // Validate status
  const validStatuses = [
    "pending",
    "processing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Check if this vendor has any items in the order
  const hasVendorItems = order.items.some(
    (item) => item.vendor && item.vendor.toString() === vendorId
  );

  if (!hasVendorItems) {
    return res
      .status(403)
      .json({ message: "You are not authorized to update this order" });
  }

  // Get vendor name for status history note
  const vendor = await Vendor.findById(vendorId).select("name");
  const vendorName = vendor ? vendor.name : "Vendor";

  // Update order status
  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    timestamp: Date.now(),
    note: `Status updated to ${status} by ${vendorName}`,
  });

  await order.save();
  try {
    console.log(`Sending notification for order status update: ${orderId}`);
    await sendPushNotification(
      order.customer.toString(),
      'Order Status Updated',
      `Your order #${order.orderNumber} status is now ${status}`,
      { type: 'order', orderId: order._id.toString(), status }
    );
    console.log('Push notification sent for status update');
  } catch (notifError) {
    console.error('Error sending push notification for status update:', notifError);
  }

  res.json({
    message: "Order status updated successfully",
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusHistory: order.statusHistory,
    },
  });
});

// @desc    Get vendor order statistics
// @route   GET /api/vendor/orders/stats
// @access  Private (vendor)
exports.getOrderStats = asyncHandler(async (req, res) => {
  const vendorId = req.vendor.id;

  // Get counts by status
  const statusCounts = await Order.aggregate([
    // Match orders containing items from this vendor
    { $match: { "items.vendor": { $eq: vendorId } } },
    // Unwind the items array to work with individual items
    { $unwind: "$items" },
    // Only keep items from this vendor
    { $match: { "items.vendor": { $eq: vendorId } } },
    // Group by order status
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
  ]);

  // Get total orders and revenue
  const totals = await Order.aggregate([
    // Match orders containing items from this vendor
    { $match: { "items.vendor": { $eq: vendorId } } },
    // Unwind the items array to work with individual items
    { $unwind: "$items" },
    // Only keep items from this vendor
    { $match: { "items.vendor": { $eq: vendorId } } },
    // Group all together for totals
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
  ]);

  // Format the results
  const formattedStats = {
    total:
      totals.length > 0
        ? {
            orders: totals[0].totalOrders,
            revenue: totals[0].totalRevenue,
          }
        : { orders: 0, revenue: 0 },
    byStatus: statusCounts.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        revenue: stat.revenue,
      };
      return acc;
    }, {}),
  };

  // Add zero counts for missing statuses
  const allStatuses = [
    "pending",
    "processing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  allStatuses.forEach((status) => {
    if (!formattedStats.byStatus[status]) {
      formattedStats.byStatus[status] = { count: 0, revenue: 0 };
    }
  });

  res.json(formattedStats);
});

module.exports = exports;
