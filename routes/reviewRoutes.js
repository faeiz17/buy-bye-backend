// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitReview,
  getProductReviews,
  getCustomerReviews,
  updateReview,
  deleteReview,
  getReviewableProducts,
} = require("../controllers/reviewController");
const { protectCustomer } = require("../middleware/authMiddleware");

// Public routes (no authentication required)
router.get("/product/:vendorProductId", getProductReviews);

// Protected routes (authentication required)
router.use(protectCustomer);

// Submit a new review
router.post("/submit", submitReview);

// Get customer's reviews
router.get("/my-reviews", getCustomerReviews);

// Get reviewable products for customer
router.get("/reviewable-products", getReviewableProducts);

// Update a review
router.put("/:reviewId", updateReview);

// Delete a review
router.delete("/:reviewId", deleteReview);

module.exports = router; 