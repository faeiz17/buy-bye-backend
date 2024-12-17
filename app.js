const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic route to check server status
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware (optional, placeholder for expansion)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173", // local development
  "https://buy-bye-frontend-b5it6h458-faeiz17s-projects.vercel.app", // your Vercel front-end URL
];

const options = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(options)); // Use CORS middleware

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const vendorRoutes = require("./routes/vendorRoutes");

app.use("/api/vendors", vendorRoutes);

const productRoutes = require("./routes/productRoutes");

app.use("/api/products", productRoutes);
