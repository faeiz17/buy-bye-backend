// models/VendorProductReview.js
const mongoose = require("mongoose");

const vendorProductReviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    vendorProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProduct",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    // Optional fields for better review system
    productQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    deliveryExperience: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Review status
    isVerified: {
      type: Boolean,
      default: false, // Verified that customer actually purchased
    },
    isHelpful: {
      type: Number,
      default: 0, // Count of helpful votes
    },
    isReported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
vendorProductReviewSchema.index({ vendorProduct: 1, createdAt: -1 });
vendorProductReviewSchema.index({ customer: 1, createdAt: -1 });
vendorProductReviewSchema.index({ order: 1 });
vendorProductReviewSchema.index({ rating: 1 });
vendorProductReviewSchema.index({ isVerified: 1 });

// Ensure one review per customer per vendor product per order
vendorProductReviewSchema.index(
  { customer: 1, vendorProduct: 1, order: 1 },
  { unique: true }
);

// Virtual for average rating calculation
vendorProductReviewSchema.virtual("averageRating").get(function () {
  const ratings = [this.rating];
  if (this.productQuality) ratings.push(this.productQuality);
  if (this.deliveryExperience) ratings.push(this.deliveryExperience);
  if (this.valueForMoney) ratings.push(this.valueForMoney);
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Ensure virtuals are included in JSON output
vendorProductReviewSchema.set("toJSON", { virtuals: true });
vendorProductReviewSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("VendorProductReview", vendorProductReviewSchema); 