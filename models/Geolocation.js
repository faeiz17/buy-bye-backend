const mongoose = require("mongoose");

const geolocationSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  coordinates: { type: String, required: true },
  address: { type: String, required: true },
});

module.exports = mongoose.model("Geolocation", geolocationSchema);
