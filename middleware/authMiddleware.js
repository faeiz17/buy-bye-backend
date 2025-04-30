// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");
const Vendor = require("../models/Vendor");
const User = require("../models/User");

// Reusable token verifier
const verifyToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.split(" ")[1];
  }
  return null;
};

// — Protect Customer routes
const protectCustomer = asyncHandler(async (req, res, next) => {
  const token = verifyToken(req);
  if (!token) {
    res.status(401);
    throw new Error("Not authorized as customer, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id).select("-password");
    if (!customer) {
      res.status(401);
      throw new Error("Not authorized as customer");
    }
    req.customer = customer;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized as customer, token failed");
  }
});

// — Protect Vendor routes
const protectVendor = asyncHandler(async (req, res, next) => {
  const token = verifyToken(req);
  if (!token) {
    res.status(401);
    throw new Error("Not authorized as vendor, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendor = await Vendor.findById(decoded.id).select("-password");
    if (!vendor) {
      res.status(401);
      throw new Error("Not authorized as vendor");
    }
    req.vendor = vendor;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized as vendor, token failed");
  }
});

// — Protect Admin routes
const protectAdmin = asyncHandler(async (req, res, next) => {
  const token = verifyToken(req);
  if (!token) {
    res.status(401);
    throw new Error("Not authorized as admin, no token");
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(id).select("-password");
    if (!admin || admin.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized as admin");
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized as admin, token failed");
  }
});

// — Utility function to generate JWT tokens
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = {
  protectCustomer,
  protectVendor,
  protectAdmin,
  generateToken,
};
