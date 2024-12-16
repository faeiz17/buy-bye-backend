const mongoose = require("mongoose");

const productPriceHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  date: { type: Date, default: Date.now },
  price: { type: Number, required: true },
});

module.exports = mongoose.model(
  "ProductPriceHistory",
  productPriceHistorySchema
);
