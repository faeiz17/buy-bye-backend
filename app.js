// app.js (or server.js)
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Initialize Express
const app = express();

// 1) CORS — register this first, so all following routes get the CORS headers
app.use(cors());
// 2) Body parser — so req.body is populated
app.use(express.json());

// 3) Connect to your database
// connectDB();

// 4) Mount your routes
app.get("/", (req, res) => res.send("API is running..."));

const userRoutes = require("./routes/userRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");

const vendorProductRoutes = require("./routes/vendorProductRoutes");
const customerRoutes = require("./routes/customerRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const vendorOrderRoutes = require("./routes/vendorOrderRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/vendor-products", vendorProductRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vendor/orders", vendorOrderRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/recipe", recipeRoutes);
app.use("/api/reviews", reviewRoutes);

// 5) Error handler — after all routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ message: err.message });
});

// 6) Start listening — last
// Connect to DB at the top-level for Vercel
connectDB();



// Export the app for Vercel serverless
module.exports = app;
