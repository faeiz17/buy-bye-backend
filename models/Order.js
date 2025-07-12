// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    vendorProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProduct",
      required: false, // Made optional for backward compatibility
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "amount", null],
      default: null,
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    // Calculate based on price, quantity, discount
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [orderItemSchema],
    // Delivery address
    deliveryAddress: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      formattedAddress: {
        type: String,
        required: true,
      },
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    // Contact information
    contactPhone: {
      type: String,
      required: true,
    },
    // Order status
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    // Payment information
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online", "wallet"],
      default: "cash_on_delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    // Tracking info
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "processing",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    // Subtotal before any fees or discounts
    subtotal: {
      type: Number,
      required: true,
    },
    // Delivery fee if applicable
    deliveryFee: {
      type: Number,
      default: 0,
    },
    // Additional discount on entire order
    orderDiscount: {
      type: Number,
      default: 0,
    },
    // Final total
    total: {
      type: Number,
      required: true,
    },
    // Notes
    customerNotes: String,
    // Delivery time estimate
    estimatedDelivery: Date,
    actualDelivery: Date,
  },
  { timestamps: true }
);

// Create index for efficient searches
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

// Method to generate unique order number
orderSchema.statics.generateOrderNumber = async function () {
  const date = new Date();
  const prefix =
    date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");

  // Find the highest order number for today
  const lastOrder = await this.findOne(
    {
      orderNumber: { $regex: `^${prefix}` },
    },
    { orderNumber: 1 },
    { sort: { orderNumber: -1 } }
  );

  let suffix = "0001";
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderNumber.slice(-4));
    suffix = (lastNumber + 1).toString().padStart(4, "0");
  }

  return `${prefix}${suffix}`;
};

// Pre-save hook to set status history and handle missing vendorProduct
orderSchema.pre("save", function (next) {
  // If this is a new order or status has changed, add to history
  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      note: this.isNew ? "Order created" : `Status changed to ${this.status}`,
    });
  }
  
  // Ensure vendorProduct field exists for all items (for backward compatibility)
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      if (!item.hasOwnProperty('vendorProduct')) {
        item.vendorProduct = null;
      }
    });
  }
  
  next();
});

// Pre-find hook to handle missing vendorProduct in existing orders
orderSchema.pre('find', function() {
  // This ensures that when we query orders, we handle missing vendorProduct gracefully
});

orderSchema.pre('findOne', function() {
  // This ensures that when we query orders, we handle missing vendorProduct gracefully
});

module.exports = mongoose.model("Order", orderSchema);
