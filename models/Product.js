const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageURL: { type: String, required: true },
  basePrice: { type: Number, required: true },
  discountedPrice: { type: Number, required: true }, // Add discounted price
  category: { type: String, required: true },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  qualityScore: { type: Number, default: 0 },
});

module.exports = mongoose.model("Product", productSchema);
