// controllers/orderController.js
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Customer = require("../models/Customer");
const VendorProduct = require("../models/VendorProduct");

// @desc    Create a new order from cart
// @route   POST /api/orders
// @access  Private (customer)
exports.createOrder = asyncHandler(async (req, res) => {
  const { deliveryAddress, contactPhone, customerNotes, paymentMethod } =
    req.body;

  // Validate required fields
  if (!deliveryAddress || !contactPhone) {
    return res.status(400).json({
      message: "Delivery address and contact phone are required",
    });
  }

  // Find customer's cart
  const cart = await Cart.findOne({ customer: req.customer.id }).populate({
    path: "items.vendorProduct",
    populate: [
      {
        path: "product",
        select: "title price imageUrl",
      },
      {
        path: "vendor",
        select: "name location",
      },
    ],
  });

  if (!cart || !cart.items.length) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // Prepare order items from cart items
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const vp = cartItem.vendorProduct;

    // Skip if product or vendor information is missing
    if (!vp || !vp.product || !vp.vendor) {
      continue;
    }

    // Calculate item price with discount
    let itemPrice = vp.product.price;
    let itemTotalPrice = itemPrice * cartItem.quantity;

    // Apply vendor product discount if exists
    if (vp.discountType && vp.discountValue > 0) {
      if (vp.discountType === "percentage") {
        const discountAmount = (itemPrice * vp.discountValue) / 100;
        itemPrice -= discountAmount;
      } else if (vp.discountType === "amount") {
        itemPrice -= vp.discountValue;
      }
      // Recalculate with discount
      itemTotalPrice = itemPrice * cartItem.quantity;
    }

    // Add to order items
    orderItems.push({
      product: vp.product._id,
      vendor: vp.vendor._id,
      quantity: cartItem.quantity,
      price: itemPrice,
      discountType: vp.discountType,
      discountValue: vp.discountValue,
      totalPrice: itemTotalPrice,
    });

    // Add to subtotal
    subtotal += itemTotalPrice;
  }

  if (!orderItems.length) {
    return res.status(400).json({ message: "No valid items in cart" });
  }

  // Calculate delivery fee (implement your logic here)
  const deliveryFee = 0; // For now, no delivery fee

  // Apply any additional order-level discounts (implement your logic here)
  const orderDiscount = 0; // For now, no additional discount

  // Calculate final total
  const total = subtotal + deliveryFee - orderDiscount;

  // Generate unique order number
  const orderNumber = await Order.generateOrderNumber();

  // Create the order
  const order = new Order({
    orderNumber,
    customer: req.customer.id,
    items: orderItems,
    deliveryAddress,
    contactPhone,
    customerNotes,
    paymentMethod: paymentMethod || "cash_on_delivery",
    subtotal,
    deliveryFee,
    orderDiscount,
    total,
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  });

  // Save the order
  await order.save();

  // Clear the cart after successful order creation
  cart.items = [];
  cart.lastUpdated = Date.now();
  await cart.save();

  // Return the created order
  const populatedOrder = await Order.findById(order._id)
    .populate("customer", "name email")
    .populate("items.product", "title imageUrl")
    .populate("items.vendor", "name");

  res.status(201).json(populatedOrder);
});

// @desc    Get all orders for the current customer
// @route   GET /api/orders
// @access  Private (customer)
exports.getCustomerOrders = asyncHandler(async (req, res) => {
  // Get query parameters for filtering
  const { status, limit = 10, page = 1 } = req.query;

  // Build query
  const query = { customer: req.customer.id };
  if (status) {
    query.status = status;
  }

  // Count total orders for pagination
  const total = await Order.countDocuments(query);

  // Get orders with pagination
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("items.product", "title imageUrl")
    .populate("items.vendor", "name");

  res.json({
    orders,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (customer)
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customer: req.customer.id,
  })
    .populate("customer", "name email")
    .populate("items.product", "title imageUrl")
    .populate("items.vendor", "name location");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private (customer)
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customer: req.customer.id,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Only pending or processing orders can be cancelled
  if (order.status !== "pending" && order.status !== "processing") {
    return res.status(400).json({
      message: `Cannot cancel order in ${order.status} status`,
    });
  }

  // Update order status
  order.status = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    timestamp: Date.now(),
    note: req.body.reason || "Cancelled by customer",
  });

  await order.save();

  res.json({
    message: "Order cancelled successfully",
    order,
  });
});

// @desc    Get order tracking details
// @route   GET /api/orders/:id/tracking
// @access  Private (customer)
exports.getOrderTracking = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customer: req.customer.id,
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
// Add this new function to your orderController.js file

// @desc    Create a new order directly (not from cart)
// @route   POST /api/orders/direct
// @access  Private (customer)
exports.createDirectOrder = asyncHandler(async (req, res) => {
  const {
    items,
    deliveryAddress,
    contactPhone,
    customerNotes,
    paymentMethod,
    subtotal,
    deliveryFee = 0,
    orderDiscount = 0,
    total,
  } = req.body;

  // Validate required fields
  if (!items || !items.length || !deliveryAddress || !contactPhone) {
    return res.status(400).json({
      message: "Items, delivery address and contact phone are required",
    });
  }

  // Validate item structure
  for (const item of items) {
    if (
      !item.vendorProductId ||
      !item.quantity ||
      typeof item.price !== "number"
    ) {
      return res.status(400).json({
        message:
          "Each item must include vendorProductId, quantity, and a numeric price",
      });
    }
  }

  // Process items to match the schema requirements
  const orderItems = [];
  let calculatedSubtotal = 0;

  try {
    for (const item of items) {
      // Fetch the vendor product to get product and vendor info
      const vendorProduct = await VendorProduct.findById(item.vendorProductId)
        .populate("product", "title price imageUrl")
        .populate("vendor", "name location");

      if (!vendorProduct) {
        return res.status(404).json({
          message: `Vendor product not found: ${item.vendorProductId}`,
        });
      }

      // Create order item with proper structure
      const orderItem = {
        product: vendorProduct.product._id,
        vendor: vendorProduct.vendor._id,
        quantity: item.quantity,
        price: item.price,
        discountType: vendorProduct.discountType || null,
        discountValue: vendorProduct.discountValue || 0,
        totalPrice: item.price * item.quantity,
      };

      orderItems.push(orderItem);
      calculatedSubtotal += orderItem.totalPrice;
    }

    // Use provided values or calculate if not provided
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTotal = total || finalSubtotal + deliveryFee - orderDiscount;

    // Generate unique order number
    const orderNumber = await Order.generateOrderNumber();

    // Create the order
    const order = new Order({
      orderNumber,
      customer: req.customer.id,
      items: orderItems,
      deliveryAddress,
      contactPhone,
      customerNotes,
      paymentMethod: paymentMethod || "cash_on_delivery",
      subtotal: finalSubtotal,
      deliveryFee,
      orderDiscount,
      total: finalTotal,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    // Save the order
    await order.save();

    // Return the created order
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email")
      .populate("items.product", "title imageUrl")
      .populate("items.vendor", "name");

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

module.exports = exports;
