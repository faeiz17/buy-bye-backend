// models/VendorProduct.js
const mongoose = require("mongoose");

const vendorProductSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // optional discount:
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: null,
    },
    discountValue: { type: Number, min: 0, default: 0 },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorProduct", vendorProductSchema);
