const asyncHandler = require("express-async-handler");
const Vendor = require("../models/Vendor"); // Adjust the path as needed
const User = require("../models/User"); // Adjust the path as needed

// @desc    Create a new vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = asyncHandler(async (req, res) => {
  const { storeName, location, geolocationCoordinates } = req.body;

  if (!storeName || !location || !geolocationCoordinates) {
    res.status(400);
    throw new Error("All fields are required.");
  }

  // Check if user is already a vendor
  const existingVendor = await Vendor.findOne({ user: req.user.id });
  if (existingVendor) {
    res.status(400);
    throw new Error("User already has a vendor profile.");
  }

  const vendor = new Vendor({
    user: req.user.id,
    storeName,
    location,
    geolocationCoordinates,
  });

  const createdVendor = await vendor.save();
  res.status(201).json(createdVendor);
});

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().populate("user", "name email phone");
  res.status(200).json(vendors);
});

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }
  res.status(200).json(vendor);
});

// @desc    Update vendor details
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  // Check if the logged-in user owns the vendor profile
  if (vendor.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to update this vendor profile");
  }

  const { storeName, location, geolocationCoordinates, rating } = req.body;

  vendor.storeName = storeName || vendor.storeName;
  vendor.location = location || vendor.location;
  vendor.geolocationCoordinates =
    geolocationCoordinates || vendor.geolocationCoordinates;
  vendor.rating = rating || vendor.rating;

  const updatedVendor = await vendor.save();
  res.status(200).json(updatedVendor);
});

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  // Check if the logged-in user owns the vendor profile
  if (vendor.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to delete this vendor profile");
  }

  const result = await Vendor.findByIdAndDelete(vendor.id);
  res.status(200).json({ message: "Vendor removed" });
});

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
