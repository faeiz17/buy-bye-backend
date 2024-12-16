const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  reviewDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ProductReview", productReviewSchema);
