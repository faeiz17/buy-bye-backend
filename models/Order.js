const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderDate: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  deliveryType: {
    type: String,
    enum: ["Delivery", "In-Store Pickup"],
    required: true,
  },
  deliveryFee: { type: Number, required: true },
  deliveryStatus: {
    type: String,
    enum: ["Pending", "In-Progress", "Delivered"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Order", orderSchema);
