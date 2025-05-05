// routes/customerRoutes.js
const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  verifyEmail,
  getNearbyVendors,
  updateLocation,
  getNearbyProducts,
  searchNearbyVendorsAndProducts,
  priceComparison,
  createRationPack
} = require("../controllers/customerController");
const { protectCustomer } = require("../middleware/authMiddleware");
const { savePushToken } = require('../controllers/notificationController');
// @route   POST /api/customers/register
// @desc    Register a new customer
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Valid email is required").isEmail(),
    check("password", "Password of min length 6 required").isLength({ min: 6 }),
    check("phone", "Phone number is invalid").optional().isMobilePhone(),
  ],
  (req, res, next) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  registerCustomer
);

// @route   GET /api/customers/verify-email/:token
// @desc    Verify customer email with token
// @access  Public
router.get("/verify-email/:token", verifyEmail);

// @route   POST /api/customers/login
// @desc    Login customer & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Valid email is required").isEmail(),
    check("password", "Password is required").exists(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  loginCustomer
);

// @route   GET /api/customers/profile
// @desc    Get current customer profile
// @access  Private
router.get("/profile", protectCustomer, getCustomerProfile);

//notifcation
router.post('/push-token', protectCustomer, savePushToken);

// @route   PUT /api/customers/profile
// @desc    Update customer profile
// @access  Private
router.put(
  "/profile",
  protectCustomer,
  [
    check("email", "Must be a valid email").optional().isEmail(),
    check("password", "Password min length 6").optional().isLength({ min: 6 }),
    check("phone", "Phone number is invalid").optional().isMobilePhone(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateCustomerProfile
);

// @route   GET /api/customers/nearby-vendors
// @desc    Find vendors near customer's location
// @access  Private
router.get("/nearby-vendors", protectCustomer, getNearbyVendors);

// @route   POST /api/customers/update-location
// @desc    Update customer's current location
// @access  Private
router.post(
  "/update-location",
  protectCustomer,
  [
    check("lat", "Latitude is required when providing coordinates")
      .if((body) => !body.address)
      .notEmpty(),
    check("lng", "Longitude is required when providing coordinates")
      .if((body) => !body.address)
      .notEmpty(),
    check("address", "Address is required when not providing coordinates")
      .if((body) => !body.lat || !body.lng)
      .notEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateLocation
);

// @route   GET /api/customers/nearby-products
// @desc    Find products from vendors near customer location
// @access  Private
router.get("/nearby-products", protectCustomer, getNearbyProducts);

// @route   GET /api/customers/search-nearby-vendors-products
// @desc    Search for vendors and products near customer location
// @access  Private
router.get(
  "/search-nearby-vendors-products",
  protectCustomer,
  [
    check("searchTerm", "Search term must be at least 2 characters")
      .optional()
      .isLength({ min: 2 }),
    check("radius", "Radius must be a number between 0.1 and 50")
      .optional()
      .isFloat({ min: 0.1, max: 50 }),
    check("categoryId", "Invalid category ID").optional().isMongoId(),
    check("subCategoryId", "Invalid subcategory ID").optional().isMongoId(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  searchNearbyVendorsAndProducts
);
// @route   GET /api/customers/price-comparison
// @desc    Compare prices for a given product among nearby vendors
// @access  Private
router.get("/price-comparison", protectCustomer, priceComparison);


router.post('/ration-packs', protectCustomer, createRationPack);

module.exports = router;
