// models/Customer.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true }, // Optional but unique if provided
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Account status
    isActive: { type: Boolean, default: false }, // Only active after email is verified
    // Last login tracking
    lastLogin: Date,
    // Last known location (optional)
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    pushToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
  
);

// Create 2dsphere index for geospatial queries
customerSchema.index({ location: "2dsphere" });

// Add method to generate verification token
customerSchema.methods.generateEmailVerificationToken = function () {
  // Generate a random token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

module.exports = mongoose.model("Customer", customerSchema);
