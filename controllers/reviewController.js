// controllers/reviewController.js
const VendorProductReview = require("../models/VendorProductReview");
const Order = require("../models/Order");
const VendorProduct = require("../models/VendorProduct");
const asyncHandler = require("express-async-handler");

// Submit a review for a vendor product
exports.submitReview = asyncHandler(async (req, res) => {
  const { vendorProductId, orderId, rating, review, productQuality, deliveryExperience, valueForMoney } = req.body;
  const customerId = req.customer._id;

  // Validate required fields
  if (!orderId || !rating || !review) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: orderId, rating, review",
    });
  }

  // If vendorProductId is not provided, we'll try to find it from the order
  let finalVendorProductId = vendorProductId;

  // Validate rating range
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  // Check if order exists and belongs to customer
  const order = await Order.findById(orderId).populate("items.product");
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (order.customer.toString() !== customerId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only review products from your own orders",
    });
  }

  // Check if order is delivered
  if (order.status !== "delivered") {
    return res.status(400).json({
      success: false,
      message: "You can only review products from delivered orders",
    });
  }

  // If vendorProductId is not provided, try to find it from the order items
  if (!finalVendorProductId) {
    // For older orders without vendorProduct field, find it by product and vendor combination
    const orderItem = order.items.find(item => item.vendorProduct);
    
    if (orderItem && orderItem.vendorProduct) {
      // If vendorProduct exists in the order item, use it
      finalVendorProductId = orderItem.vendorProduct;
    } else {
      // For older orders, find vendorProduct by product and vendor combination
      // We'll use the first item for now, but ideally we should pass the specific item index
      const firstItem = order.items[0];
      if (firstItem && firstItem.product && firstItem.vendor) {
        try {
          const vendorProduct = await VendorProduct.findOne({
            product: firstItem.product._id || firstItem.product,
            vendor: firstItem.vendor._id || firstItem.vendor
          });
          
          if (vendorProduct) {
            finalVendorProductId = vendorProduct._id;
            console.log(`Found vendorProduct for old order: ${vendorProduct._id}`);
          } else {
            return res.status(400).json({
              success: false,
              message: "Unable to find vendor product for this order. The product may no longer be available from this vendor.",
            });
          }
        } catch (error) {
          console.error('Error finding vendorProduct:', error);
          return res.status(400).json({
            success: false,
            message: "Unable to determine vendor product for this order. Please contact support.",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Order item information is incomplete. Please contact support.",
        });
      }
    }
  }

  // Check if vendor product exists
  const vendorProduct = await VendorProduct.findById(finalVendorProductId);
  if (!vendorProduct) {
    return res.status(404).json({
      success: false,
      message: "Vendor product not found",
    });
  }

  // Check if customer has already reviewed this vendor product for this order
  const existingReview = await VendorProductReview.findOne({
    customer: customerId,
    vendorProduct: finalVendorProductId,
    order: orderId,
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: "You have already reviewed this product for this order",
    });
  }

  // Create the review
  const newReview = new VendorProductReview({
    customer: customerId,
    vendorProduct: finalVendorProductId,
    order: orderId,
    rating,
    review,
    productQuality,
    deliveryExperience,
    valueForMoney,
    isVerified: true, // Auto-verify since we checked the order
  });

  await newReview.save();

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    data: newReview,
  });
});

// Get reviews for a vendor product
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { vendorProductId } = req.params;
  const { page = 1, limit = 10, rating, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  // Validate vendor product exists
  const vendorProduct = await VendorProduct.findById(vendorProductId);
  if (!vendorProduct) {
    return res.status(404).json({
      success: false,
      message: "Vendor product not found",
    });
  }

  // Build query
  const query = { vendorProduct: vendorProductId, isReported: false };
  if (rating) {
    query.rating = parseInt(rating);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get reviews with pagination
  const reviews = await VendorProductReview.find(query)
    .populate("customer", "name")
    .populate({
      path: "vendorProduct",
      populate: {
        path: "product",
        select: "title imageUrl",
      },
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const totalReviews = await VendorProductReview.countDocuments(query);

  // Calculate average rating and rating distribution
  const ratingStats = await VendorProductReview.aggregate([
    { $match: { vendorProduct: vendorProduct._id, isReported: false } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };
  
  // Calculate rating distribution
  const distribution = {};
  for (let i = 1; i <= 5; i++) {
    distribution[i] = stats.ratingDistribution.filter(r => r === i).length;
  }

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasNextPage: skip + reviews.length < totalReviews,
        hasPrevPage: parseInt(page) > 1,
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        ratingDistribution: distribution,
      },
    },
  });
});

// Get customer's reviews
exports.getCustomerReviews = asyncHandler(async (req, res) => {
  const customerId = req.customer._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await VendorProductReview.find({ customer: customerId })
    .populate({
      path: "vendorProduct",
      populate: {
        path: "product",
        select: "title imageUrl",
      },
    })
    .populate("order", "orderNumber")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalReviews = await VendorProductReview.countDocuments({ customer: customerId });

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasNextPage: skip + reviews.length < totalReviews,
        hasPrevPage: parseInt(page) > 1,
      },
    },
  });
});

// Update a review
exports.updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, review, productQuality, deliveryExperience, valueForMoney } = req.body;
  const customerId = req.customer._id;

  const existingReview = await VendorProductReview.findById(reviewId);
  if (!existingReview) {
    return res.status(404).json({
      success: false,
      message: "Review not found",
    });
  }

  if (existingReview.customer.toString() !== customerId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only update your own reviews",
    });
  }

  // Update fields
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }
    existingReview.rating = rating;
  }

  if (review !== undefined) {
    existingReview.review = review;
  }

  if (productQuality !== undefined) {
    existingReview.productQuality = productQuality;
  }

  if (deliveryExperience !== undefined) {
    existingReview.deliveryExperience = deliveryExperience;
  }

  if (valueForMoney !== undefined) {
    existingReview.valueForMoney = valueForMoney;
  }

  await existingReview.save();

  res.json({
    success: true,
    message: "Review updated successfully",
    data: existingReview,
  });
});

// Delete a review
exports.deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const customerId = req.customer._id;

  const review = await VendorProductReview.findById(reviewId);
  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found",
    });
  }

  if (review.customer.toString() !== customerId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own reviews",
    });
  }

  await VendorProductReview.findByIdAndDelete(reviewId);

  res.json({
    success: true,
    message: "Review deleted successfully",
  });
});

// Get reviewable products for a customer (products from delivered orders that haven't been reviewed)
exports.getReviewableProducts = asyncHandler(async (req, res) => {
  const customerId = req.customer._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get delivered orders for the customer
  const deliveredOrders = await Order.find({
    customer: customerId,
    status: "delivered",
  }).select("_id orderNumber items createdAt");

  if (deliveredOrders.length === 0) {
    return res.json({
      success: true,
      data: {
        products: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });
  }

  const orderIds = deliveredOrders.map(order => order._id);

  // Get all reviews by this customer
  const customerReviews = await VendorProductReview.find({
    customer: customerId,
    order: { $in: orderIds },
  }).select("vendorProduct order");

  // Create a map of reviewed vendor products
  const reviewedMap = new Map();
  customerReviews.forEach(review => {
    const key = `${review.vendorProduct}_${review.order}`;
    reviewedMap.set(key, true);
  });

  // Get all vendor products from delivered orders
  const allVendorProducts = [];
  
  for (const order of deliveredOrders) {
    for (const item of order.items) {
      // Handle both new orders (with vendorProduct) and old orders (without vendorProduct)
      let vendorProductId = item.vendorProduct;
      
      // For old orders without vendorProduct, try to find it by product and vendor
      if (!vendorProductId && item.product && item.vendor) {
        try {
          // Find the vendorProduct by product and vendor combination
          const vendorProduct = await VendorProduct.findOne({
            product: item.product,
            vendor: item.vendor
          });
          
          if (vendorProduct) {
            vendorProductId = vendorProduct._id;
            console.log(`Found vendorProduct for old order ${order._id}, item ${item.product}`);
          } else {
            console.warn(`No vendorProduct found for product ${item.product} and vendor ${item.vendor} in order ${order._id}`);
            continue; // Skip this item
          }
        } catch (error) {
          console.error(`Error finding vendorProduct for order ${order._id}:`, error);
          continue; // Skip this item
        }
      }
      
      if (!vendorProductId) {
        console.warn(`Order ${order._id} item missing vendorProduct reference and cannot be resolved`);
        continue; // Skip items without vendorProduct reference
      }
      
      const key = `${vendorProductId}_${order._id}`;
      if (!reviewedMap.has(key)) {
        allVendorProducts.push({
          vendorProduct: vendorProductId,
          order: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
        });
      }
    }
  }

  // Get vendor product details
  const vendorProductIds = [...new Set(allVendorProducts.map(item => item.vendorProduct))];
  const vendorProducts = await VendorProduct.find({
    _id: { $in: vendorProductIds },
  }).populate({
    path: "product",
    select: "title imageUrl category subCategory",
  }).populate("vendor", "name");

  // Combine data
  const reviewableProducts = allVendorProducts
    .map(item => {
      const vendorProduct = vendorProducts.find(vp => vp._id.toString() === item.vendorProduct.toString());
      if (!vendorProduct) return null;

      return {
        vendorProduct: vendorProduct._id,
        product: vendorProduct.product,
        vendor: vendorProduct.vendor,
        order: item.order,
        orderNumber: item.orderNumber,
        orderDate: item.orderDate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  // Apply pagination
  const totalProducts = reviewableProducts.length;
  const paginatedProducts = reviewableProducts.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: {
      products: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
        totalProducts,
        hasNextPage: skip + paginatedProducts.length < totalProducts,
        hasPrevPage: parseInt(page) > 1,
      },
    },
  });
});
