// routes/vendorRoutes.js
const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const {
  registerVendor,
  loginVendor,
  getVendorProfile,
  updateVendorProfile,
  getNearbyVendors,
  verifyEmail,
  requestPhoneVerification,
  verifyPhone,
  resendEmailVerification,
  getAllVendors,
  getVendorById,
} = require("../controllers/vendorController");
const { protectVendor } = require("../middleware/authMiddleware");

// @route   POST /api/vendors/register
// @desc    Register a new vendor
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Valid email is required").isEmail(),
    check("password", "Password of min length 6 required").isLength({ min: 6 }),
    check("address", "Address is required").notEmpty(),
    check("phone", "Phone number is invalid").optional().isMobilePhone(),
  ],
  (req, res, next) => {
    // handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  registerVendor
);

// @route   GET /api/vendors/verify-email/:token
// @desc    Verify vendor email with token
// @access  Public
router.get("/verify-email/:token", verifyEmail);

// @route   POST /api/vendors/resend-verification
// @desc    Resend email verification
// @access  Private
router.post("/resend-verification", protectVendor, resendEmailVerification);

// @route   POST /api/vendors/request-phone-verification
// @desc    Request phone verification (send OTP)
// @access  Private
router.post(
  "/request-phone-verification",
  protectVendor,
  [check("phone", "Valid phone number is required").isMobilePhone()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  requestPhoneVerification
);

// @route   POST /api/vendors/verify-phone
// @desc    Verify phone with OTP
// @access  Private
router.post(
  "/verify-phone",
  protectVendor,
  [check("code", "Verification code is required").notEmpty()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  verifyPhone
);

// @route   POST /api/vendors/login
// @desc    Login vendor & get token
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
  loginVendor
);

// @route   GET /api/vendors/nearby?lng=&lat=
// @desc    Find vendors within 1km
// @access  Public
router.get("/nearby", getNearbyVendors);

// @route   GET /api/vendors/profile
// @desc    Get current vendor profile
// @access  Private
router.get("/profile", protectVendor, getVendorProfile);

// @route   PUT /api/vendors/profile
// @desc    Update vendor profile
// @access  Private
router.put(
  "/profile",
  protectVendor,
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
  updateVendorProfile
);

// @route   GET /api/vendors
// @desc    Get all vendors
// @access  Public
router.get("/", getAllVendors);

// @route   GET /api/vendors/:id
// @desc    Get vendor by ID
// @access  Public

router.get("/:id", getVendorById);

module.exports = router;
