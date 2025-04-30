// routes/vendorProductRoutes.js
const express = require("express");
const router = express.Router();
const {
  upsertVendorProduct,
  listVendorProducts,
  getVendorProductById,
  updateVendorProduct,
  deleteVendorProduct,
} = require("../controllers/vendorProductController");
const { protectVendor } = require("../middleware/authMiddleware");
// Get a single vendor product
router.get("/:id", getVendorProductById);
// All routes below require a logged-in vendor
router.use(protectVendor);

// Create or update a vendor product
router.post("/", upsertVendorProduct);

// List all my products
router.get("/", listVendorProducts);

// Get a single vendor product
router.get("/:id", getVendorProductById);

// Update a vendor product
router.put("/:id", updateVendorProduct);

// Delete a vendor product
router.delete("/:id", deleteVendorProduct);

module.exports = router;
