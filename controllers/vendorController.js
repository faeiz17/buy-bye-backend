// controllers/vendorController.js
const Vendor = require("../models/Vendor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
// point to new service
const { geocodeAddress, reverseGeocode } = require("../utils/geocode");
const { sendVerificationEmail } = require("../utils/email"); // You'll need to create this
const { sendSMS } = require("../utils/sms"); // You'll need to create this

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

exports.registerVendor = asyncHandler(async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  // Basic validation
  if (!name || !email || !password || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if email already exists
  if (await Vendor.findOne({ email })) {
    return res.status(400).json({ message: "Email already in use" });
  }

  // Check if phone already exists (if provided)
  if (phone && (await Vendor.findOne({ phone }))) {
    return res.status(400).json({ message: "Phone number already in use" });
  }

  // Geocode the address
  let location;
  try {
    location = await geocodeAddress(address);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create new vendor
  const vendor = new Vendor({
    name,
    email,
    password: passwordHash,
    location,
  });

  if (phone) {
    vendor.phone = phone;
  }

  // Generate email verification token
  const emailToken = vendor.generateEmailVerificationToken();

  // Save the vendor
  await vendor.save();

  if (!vendor) {
    return res.status(500).json({ message: "Vendor registration failed" });
  }

  // Send verification email
  try {
    await sendVerificationEmail(vendor.email, emailToken, vendor.name, 'vendors');
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Continue with registration even if email fails
  }

  // Get base URL from environment or use production URL
  const baseUrl = process.env.BASE_URL || 'https://buy-bye-backend.vercel.app';
  
  res.status(201).json({
    _id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    isEmailVerified: vendor.isEmailVerified,
    isPhoneVerified: vendor.isPhoneVerified,
    isActive: vendor.isActive,
    message:
      "Registration successful. Please verify your email to activate your account.",
    verificationUrl: `${baseUrl}/api/vendors/verify-email/${emailToken}`,
    token: generateToken(vendor._id),
  });
});

// Verify email with token
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const vendor = await Vendor.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!vendor) {
    return res.status(400).json({
      message: "Email verification token is invalid or has expired",
    });
  }

  // Update vendor status
  vendor.isEmailVerified = true;
  vendor.isActive = true;
  vendor.emailVerificationToken = undefined;
  vendor.emailVerificationExpires = undefined;

  await vendor.save();

  res.status(200).json({
    message: "Email verified successfully. Your account is now active.",
  });
});

// Request phone verification
exports.requestPhoneVerification = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const vendor = await Vendor.findById(req.vendor.id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Check if phone already exists with a different vendor
  const existingVendor = await Vendor.findOne({
    phone,
    _id: { $ne: vendor._id },
  });
  if (existingVendor) {
    return res.status(400).json({ message: "Phone number already in use" });
  }

  // Generate and save OTP
  const verificationCode = vendor.generatePhoneVerificationCode();
  vendor.phone = phone;
  await vendor.save();

  // Send OTP via SMS
  try {
    await sendSMS(phone, `Your verification code is: ${verificationCode}`);
    res.status(200).json({
      message: "Verification code sent to your phone",
    });
  } catch (error) {
    console.error("Failed to send SMS:", error);
    res.status(500).json({
      message: "Failed to send verification code",
    });
  }
});

// Verify phone with OTP
exports.verifyPhone = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Verification code is required" });
  }

  const vendor = await Vendor.findById(req.vendor.id);

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (
    !vendor.phoneVerificationCode ||
    vendor.phoneVerificationExpires < Date.now() ||
    vendor.phoneVerificationCode !== code
  ) {
    return res.status(400).json({
      message: "Verification code is invalid or has expired",
    });
  }

  // Update vendor status
  vendor.isPhoneVerified = true;
  vendor.isActive = true;
  vendor.phoneVerificationCode = undefined;
  vendor.phoneVerificationExpires = undefined;

  await vendor.save();

  res.status(200).json({
    message: "Phone verified successfully",
    isPhoneVerified: true,
    isActive: vendor.isActive,
  });
});

// Resend email verification
exports.resendEmailVerification = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor.id);

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (vendor.isEmailVerified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  // Generate new token
  const emailToken = vendor.generateEmailVerificationToken();
  await vendor.save();

  // Send verification email
  try {
    await sendVerificationEmail(vendor.email, emailToken, vendor.name, 'vendors');
    // Get base URL from environment or use production URL
    const baseUrl = process.env.BASE_URL || 'https://buy-bye-backend.vercel.app';
    
    res.status(200).json({
      message: "Verification email resent successfully",
      verificationUrl: `${baseUrl}/api/vendors/verify-email/${emailToken}`,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    res.status(500).json({
      message: "Failed to send verification email",
    });
  }
});

exports.getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor.id).select("-password");
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  // since we saved formattedAddress in vendor.location, just return the document:
  res.json(vendor);
});

exports.updateVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor.id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const { name, email, address, password, phone } = req.body;

  // Check if email is changed and already exists
  if (email && email !== vendor.email) {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Reset verification if email is changed
    vendor.email = email;
    vendor.isEmailVerified = false;

    // Generate email verification token
    const emailToken = vendor.generateEmailVerificationToken();

    // Send verification email
    try {
      await sendVerificationEmail(email, emailToken, vendor.name, 'vendors');
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Continue with update even if email fails
    }
  }

  // Check if phone is changed and already exists
  if (phone && phone !== vendor.phone) {
    const existingVendor = await Vendor.findOne({ phone });
    if (existingVendor) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    vendor.phone = phone;
    vendor.isPhoneVerified = false;
  }

  if (name) vendor.name = name;

  if (address) {
    try {
      vendor.location = await geocodeAddress(address);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  if (password) {
    vendor.password = await bcrypt.hash(password, 10);
  }

  const updated = await vendor.save();

  // Only return necessary fields
  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    isEmailVerified: updated.isEmailVerified,
    isPhoneVerified: updated.isPhoneVerified,
    isActive: updated.isActive,
    token: generateToken(updated._id),
  });
});

exports.getNearbyVendors = asyncHandler(async (req, res) => {
  const { lng, lat } = req.query;
  if (!lng || !lat) {
    return res
      .status(400)
      .json({ message: "lng and lat query params required" });
  }

  const radius = 1 / 6378.1; // 1 km in radians
  const vendors = await Vendor.find({
    isActive: true, // Only return active vendors
    location: {
      $geoWithin: {
        $centerSphere: [[+lng, +lat], radius],
      },
    },
  }).select(
    "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationCode -phoneVerificationExpires"
  );

  res.json(vendors);
});

exports.loginVendor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const vendor = await Vendor.findOne({ email });

  if (!vendor) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, vendor.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Check if account is active
  if (!vendor.isActive) {
    return res.status(403).json({
      message: "Account is not active. Please verify your email or phone.",
      isEmailVerified: vendor.isEmailVerified,
      isPhoneVerified: vendor.isPhoneVerified,
    });
  }

  // Update last login
  vendor.lastLogin = Date.now();
  await vendor.save();

  res.json({
    _id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    isEmailVerified: vendor.isEmailVerified,
    isPhoneVerified: vendor.isPhoneVerified,
    isActive: vendor.isActive,
    token: generateToken(vendor._id),
  });
});

//list all vendors
exports.getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({}).select(
    "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationCode -phoneVerificationExpires"
  );
  res.json(vendors);
});

// Add this method to controllers/vendorController.js

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
exports.getVendorById = asyncHandler(async (req, res) => {
  const vendorId = req.params.id;

  const vendor = await Vendor.findById(vendorId).select(
    "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationCode -phoneVerificationExpires"
  );

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Calculate distance if user location is provided
  if (req.query.lng && req.query.lat) {
    try {
      const userLng = parseFloat(req.query.lng);
      const userLat = parseFloat(req.query.lat);

      // Make sure vendor has location
      if (vendor.location && vendor.location.coordinates) {
        const [vendorLng, vendorLat] = vendor.location.coordinates;

        // Radius of the Earth in kilometers
        const R = 6371;

        // Convert latitude and longitude from degrees to radians
        const lat1Rad = userLat * (Math.PI / 180);
        const lat2Rad = vendorLat * (Math.PI / 180);
        const latDiffRad = (vendorLat - userLat) * (Math.PI / 180);
        const longDiffRad = (vendorLng - userLng) * (Math.PI / 180);

        // Haversine formula
        const a =
          Math.sin(latDiffRad / 2) * Math.sin(latDiffRad / 2) +
          Math.cos(lat1Rad) *
            Math.cos(lat2Rad) *
            Math.sin(longDiffRad / 2) *
            Math.sin(longDiffRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Add distance to response (in km)
        vendor._doc.distance = distance;
      }
    } catch (err) {
      console.error("Error calculating distance:", err);
      // Don't return an error, just continue without distance calculation
    }
  }

  res.json(vendor);
});
