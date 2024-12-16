const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  currentLocation: { type: String, required: true },
  availabilityStatus: { type: Boolean, default: true },
});

module.exports = mongoose.model("Rider", riderSchema);
