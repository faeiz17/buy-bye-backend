const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider", required: true },
  deliveryStartTime: { type: Date },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  deliveryStatus: {
    type: String,
    enum: ["Pending", "In-Progress", "Delivered"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Delivery", deliverySchema);
