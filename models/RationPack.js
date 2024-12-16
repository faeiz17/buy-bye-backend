const mongoose = require("mongoose");

const rationPackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  creationDate: { type: Date, default: Date.now },
  totalCost: { type: Number, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Many-to-many relationship
});

module.exports = mongoose.model("RationPack", rationPackSchema);
