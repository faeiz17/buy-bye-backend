// models/Vendor.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true }, // Optional but unique if provided
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Phone verification
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    // Account status
    isActive: { type: Boolean, default: false }, // Only active after either email or phone is verified
    // GeoJSON Point for shop location
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true, index: "2dsphere" },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    // Reset password
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Last login tracking
    lastLogin: Date,
  },
  { timestamps: true }
);

vendorSchema.index({ location: "2dsphere" });

// Add methods to generate verification tokens/codes
vendorSchema.methods.generateEmailVerificationToken = function () {
  // Generate a random token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

vendorSchema.methods.generatePhoneVerificationCode = function () {
  // Generate a 6-digit OTP
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  this.phoneVerificationCode = verificationCode;
  this.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return verificationCode;
};

module.exports = mongoose.model("Vendor", vendorSchema);
