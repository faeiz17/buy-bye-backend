const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  storeName: { type: String, required: true },
  location: { type: String, required: true },
  geolocationCoordinates: { type: String, required: true },
  rating: { type: Number, default: 0 },
});

module.exports = mongoose.model("Vendor", vendorSchema);
