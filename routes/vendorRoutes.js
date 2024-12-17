const express = require("express");
const router = express.Router();
const {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} = require("../controllers/vendorController"); // Adjust the path as needed
const { protect } = require("../middleware/authMiddleware"); // Middleware for authentication

// Public route to fetch all vendors
router.get("/", getAllVendors);

// Public route to fetch a specific vendor by ID
router.get("/:id", getVendorById);

// Private route to create a vendor
router.post("/", protect, createVendor);

// Private route to update a vendor
router.put("/:id", protect, updateVendor);

// Private route to delete a vendor
router.delete("/:id", protect, deleteVendor);

module.exports = router;
