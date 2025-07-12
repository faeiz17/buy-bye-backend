// controllers/customerController.js
const Customer = require("../models/Customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { geocodeAddress, reverseGeocode } = require("../utils/geocode");
const { sendVerificationEmail } = require("../utils/email");
const { sendSMS } = require("../utils/sms");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// @desc    Register a new customer
// @route   POST /api/customers/register
// @access  Public
exports.registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  }

  // Check if email already exists
  if (await Customer.findOne({ email })) {
    return res.status(400).json({ message: "Email already in use" });
  }

  // Check if phone already exists (if provided)
  if (phone && (await Customer.findOne({ phone }))) {
    return res.status(400).json({ message: "Phone number already in use" });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create customer with optional address geocoding
  const customerData = {
    name,
    email,
    password: passwordHash,
  };

  // Geocode address if provided
  if (address) {
    try {
      customerData.location = await geocodeAddress(address);
    } catch (err) {
      return res
        .status(400)
        .json({ message: `Address geocoding error: ${err.message}` });
    }
  }

  // Add phone if provided
  if (phone) {
    customerData.phone = phone;
  }

  // Add email verification fields
  customerData.isEmailVerified = false;
  customerData.emailVerificationToken = crypto.randomBytes(32).toString("hex");
  customerData.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 100000; // 24 hours

  // Create new customer
  const customer = new Customer(customerData);
  await customer.save();

  if (!customer) {
    return res.status(500).json({ message: "Customer registration failed" });
  }

  // Send verification email
  try {
    await sendVerificationEmail(
      customer.email,
      customer.emailVerificationToken,
      customer.name
    );
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Continue with registration even if email fails
  }

  res.status(201).json({
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    isEmailVerified: customer.isEmailVerified,
    isActive: customer.isActive,
    message:
      "Registration successful. Please verify your email to activate your account.",
    token: generateToken(customer._id),
  });
});

// @desc    Verify customer email with token
// @route   GET /api/customers/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const customer = await Customer.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!customer) {
    return res.status(400).json({
      message: "Email verification token is invalid or has expired",
    });
  }

  // Update customer status
  customer.isEmailVerified = true;
  customer.isActive = true;
  customer.emailVerificationToken = undefined;
  customer.emailVerificationExpires = undefined;

  await customer.save();

  res.status(200).json({
    message: "Email verified successfully. Your account is now active.",
  });
});

// @desc    Login customer & get token
// @route   POST /api/customers/login
// @access  Public
exports.loginCustomer = asyncHandler(async (req, res) => {
  console.log("Login route hit");

  const { email, password } = req.body;
  const customer = await Customer.findOne({ email });

  if (!customer) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Check if account is active/verified
  if (!customer.isActive) {
    return res.status(403).json({
      message: "Account is not active. Please verify your email.",
      isEmailVerified: customer.isEmailVerified,
    });
  }

  // Update last login
  customer.lastLogin = Date.now();
  await customer.save();

  res.json({
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    isEmailVerified: customer.isEmailVerified,
    isActive: customer.isActive,
    token: generateToken(customer._id),
  });
});

// @desc    Get customer profile
// @route   GET /api/customers/profile
// @access  Private (customer)
exports.getCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer.id).select("-password");
  if (!customer) return res.status(404).json({ message: "Customer not found" });

  res.json(customer);
});

// @desc    Update customer profile
// @route   PUT /api/customers/profile
// @access  Private (customer)
exports.updateCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer.id);
  if (!customer) return res.status(404).json({ message: "Customer not found" });

  const { name, email, address, password, phone } = req.body;

  // Check if email is changed and already exists
  if (email && email !== customer.email) {
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Reset verification if email is changed
    customer.email = email;
    customer.isEmailVerified = false;
    customer.isActive = false;

    // Generate email verification token
    customer.emailVerificationToken = crypto.randomBytes(32).toString("hex");
    customer.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Send verification email
    try {
      await sendVerificationEmail(
        email,
        customer.emailVerificationToken,
        customer.name
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Continue with update even if email fails
    }
  }

  // Update name if provided
  if (name) customer.name = name;

  // Update phone if provided
  if (phone) customer.phone = phone;

  // Update address if provided
  if (address) {
    try {
      customer.location = await geocodeAddress(address);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  // Update password if provided
  if (password) {
    customer.password = await bcrypt.hash(password, 10);
  }

  const updated = await customer.save();

  // Only return necessary fields
  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    isEmailVerified: updated.isEmailVerified,
    isActive: updated.isActive,
    token: generateToken(updated._id),
  });
});

// @desc    Search nearby vendors
// @route   GET /api/customers/nearby-vendors
// @access  Private (customer)
exports.getNearbyVendors = asyncHandler(async (req, res) => {
  // Get customer's location or use provided coordinates
  const { lat, lng } = req.query;

  let coordinates;

  if (lat && lng) {
    // Use provided coordinates
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else {
    // Use customer's stored location
    const customer = await Customer.findById(req.customer.id);
    if (!customer || !customer.location || !customer.location.coordinates) {
      return res.status(400).json({
        message:
          "No location available. Please provide lat and lng parameters or update your profile with an address.",
      });
    }
    coordinates = customer.location.coordinates;
  }

  // Find vendors within 1 km radius
  const Vendor = require("../models/Vendor");
  const radius = 1 / 6378.1; // 1 km in radians

  const vendors = await Vendor.find({
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [coordinates, radius],
      },
    },
  }).select(
    "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationCode -phoneVerificationExpires"
  );

  res.json(vendors);
});

// @desc    Update customer location
// @route   POST /api/customers/update-location
// @access  Private (customer)
exports.updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, address } = req.body;

  if ((!lat || !lng) && !address) {
    return res.status(400).json({
      message: "Either coordinates (lat/lng) or address must be provided",
    });
  }

  const customer = await Customer.findById(req.customer.id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  let location;

  if (address) {
    // Use address for geocoding
    try {
      location = await geocodeAddress(address);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  } else {
    // Use provided coordinates
    try {
      const formattedAddress = await reverseGeocode(lat, lng);
      location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
        formattedAddress,
      };
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  customer.location = location;
  await customer.save();

  res.json({
    message: "Location updated successfully",
    location: customer.location,
  });
});

// @desc    Get nearby products from all vendors
// @route   GET /api/customers/nearby-products
// @access  Private (customer)
exports.getNearbyProducts = asyncHandler(async (req, res) => {
  // Get customer's location or use provided coordinates
  const { lat, lng, categoryId, subCategoryId } = req.query;
  const radius = req.query.radius
    ? parseFloat(req.query.radius) / 6378.1
    : 1 / 6378.1; // Default 1km

  let coordinates;

  if (lat && lng) {
    // Use provided coordinates
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else {
    // Use customer's stored location
    const customer = await Customer.findById(req.customer.id);
    if (!customer || !customer.location || !customer.location.coordinates) {
      return res.status(400).json({
        message:
          "No location available. Please provide lat and lng parameters or update your profile with an address.",
      });
    }
    coordinates = customer.location.coordinates;
  }

  // Find vendors within radius
  const Vendor = require("../models/Vendor");
  const VendorProduct = require("../models/VendorProduct");

  // First get vendors within range
  const vendors = await Vendor.find({
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [coordinates, radius],
      },
    },
  }).select("_id");

  if (!vendors.length) {
    return res.json({ message: "No vendors found nearby", products: [] });
  }

  // Get vendor IDs
  const vendorIds = vendors.map((v) => v._id);

  // Build query to find products from these vendors
  let query = { vendor: { $in: vendorIds }, inStock: true };

  // Populate based on available filters
  const populateOptions = [
    { path: "vendor", select: "name location" },
    {
      path: "product",
      select: "title price imageUrl category subCategory",
      populate: [
        { path: "category", select: "name" },
        { path: "subCategory", select: "name" },
      ],
    },
  ];

  // Apply category filter if provided
  if (categoryId) {
    populateOptions[1].match = { category: categoryId };
  }

  // Apply subcategory filter if provided
  if (subCategoryId) {
    populateOptions[1].match = {
      ...(populateOptions[1].match || {}),
      subCategory: subCategoryId,
    };
  }

  // Find vendor products
  let products = await VendorProduct.find(query)
    .populate(populateOptions)
    .sort({ createdAt: -1 });

  // Filter out products that didn't match our category/subcategory filters
  products = products.filter((p) => p.product !== null);

  res.json(products);
});

// @desc Search Nearby Vendors and Products
// @route GET /api/customers/search-nearby-vendors-products
// @access Private (customer)
// @desc Search Nearby Vendors and Products
// @route GET /api/customers/search-nearby-vendors-products
// @access Private (customer)
// Update to the searchNearbyVendorsAndProducts function to support 
// all the new features including radius filtering and proper sorting
exports.searchNearbyVendorsAndProducts = asyncHandler(async (req, res) => {
  // Get search parameters
  const {
    lat,
    lng,
    searchTerm,
    categoryId,
    subCategoryId,
    vendorType,
    radius: radiusParam , // Default 1km
    sortBy = 'nearest', // Default sort order
  } = req.query;

  // Validate and convert radius to radians (for MongoDB's $centerSphere)
  const validRadiusOptions = [1, 3, 5, 10,15,20,25,50];
  const requestedRadius = parseInt(radiusParam, 10) || 1;
  const radius = (validRadiusOptions.includes(requestedRadius) ? requestedRadius : 1) / 6378.1;

  let coordinates;

  if (lat && lng) {
    // Use provided coordinates
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else {
    // Use customer's stored location
    const customer = await Customer.findById(req.customer.id);
    if (!customer || !customer.location || !customer.location.coordinates) {
      return res.status(400).json({
        message:
          "No location available. Please provide lat and lng parameters or update your profile with an address.",
      });
    }
    coordinates = customer.location.coordinates;
  }

  // Import required models
  const Vendor = require("../models/Vendor");
  const VendorProduct = require("../models/VendorProduct");
  const VendorProductReview = require("../models/VendorProductReview"); // Added this import

  // Prepare result container
  const result = {
    vendors: [],
    products: [],
  };

  // 1. Search vendors first
  let vendorQuery = {
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [coordinates, radius],
      },
    },
  };

  // Add vendor type filter if provided
  if (vendorType) {
    vendorQuery.vendorType = vendorType;
  }

  // Add search term if provided for vendors
  if (searchTerm) {
    vendorQuery.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Find matching vendors
  const vendors = await Vendor.find(vendorQuery)
    .select(
      "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationCode -phoneVerificationExpires"
    );

  // Calculate and add distance for each vendor for sorting
  const vendorsWithDistance = vendors.map(vendor => {
    // Get vendor coords
    const vendorCoords = vendor.location.coordinates;
    
    // Calculate distance using Haversine formula
    const R = 6371; // Radius of the earth in km
    const lat1 = coordinates[1] * Math.PI / 180;
    const lat2 = vendorCoords[1] * Math.PI / 180;
    const latDiff = (vendorCoords[1] - coordinates[1]) * Math.PI / 180;
    const lngDiff = (vendorCoords[0] - coordinates[0]) * Math.PI / 180;
    const a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(lngDiff/2) * Math.sin(lngDiff/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Convert Mongoose document to plain object
    const vendorObj = vendor.toObject();
    vendorObj.distance = distance;
    
    return vendorObj;
  });

  // Sort vendors based on sortBy parameter
  const sortedVendors = [...vendorsWithDistance];
  
  if (sortBy === 'nearest') {
    sortedVendors.sort((a, b) => a.distance - b.distance);
  } else if (sortBy === 'farthest') {
    sortedVendors.sort((a, b) => b.distance - a.distance);
  }
  // Other sort options don't apply to vendors
  
  result.vendors = sortedVendors;

  // 2. Get all nearby vendors (regardless of search term) to find their products
  const allNearbyVendors = await Vendor.find({
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [coordinates, radius],
      },
    },
  }).select("_id location");

  if (!allNearbyVendors.length) {
    return res.json({
      message: "No vendors found nearby",
      vendors: result.vendors,
      products: [],
    });
  }

  // Get vendor IDs
  const vendorIds = allNearbyVendors.map((v) => v._id);

  // Build query to find products from these vendors
  let query = { vendor: { $in: vendorIds }, inStock: true };

  // Set up populate options
  const populateOptions = [
    { path: "vendor", select: "name location" },
    {
      path: "product",
      select: "title price imageUrl category subCategory description",
      populate: [
        { path: "category", select: "name" },
        { path: "subCategory", select: "name" },
      ],
    },
  ];

  // Apply category filter if provided
  if (categoryId) {
    populateOptions[1].match = { category: categoryId };
  }

  // Apply subcategory filter if provided
  if (subCategoryId) {
    populateOptions[1].match = {
      ...(populateOptions[1].match || {}),
      subCategory: subCategoryId,
    };
  }

  // Find vendor products
  let products = await VendorProduct.find(query)
    .populate(populateOptions);

  // Filter out products that didn't match our category/subcategory filters
  products = products.filter((p) => p.product !== null);

  // Apply text search filter if provided
  if (searchTerm) {
    const regex = new RegExp(searchTerm, "i");
    products = products.filter((p) => {
      return (
        regex.test(p.product.title) ||
        (p.product.description && regex.test(p.product.description))
      );
    });
  }

  // Convert to plain objects for manipulation
  const productsWithDistanceAndPrice = products.map(product => {
    const productObj = product.toObject();
    
    // Add distance
    const vendorLocation = product.vendor?.location;
    if (vendorLocation && vendorLocation.coordinates) {
      const vendorCoords = vendorLocation.coordinates;
      
      // Calculate distance using Haversine formula
      const R = 6371; // Radius of the earth in km
      const lat1 = coordinates[1] * Math.PI / 180;
      const lat2 = vendorCoords[1] * Math.PI / 180;
      const latDiff = (vendorCoords[1] - coordinates[1]) * Math.PI / 180;
      const lngDiff = (vendorCoords[0] - coordinates[0]) * Math.PI / 180;
      const a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(lngDiff/2) * Math.sin(lngDiff/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      productObj.distance = distance;
    } else {
      productObj.distance = 9999; // Large number for unknown distances
    }
    
    // Process final price for sorting
    let basePrice = 0;
    if (typeof product.product.price === 'number') {
      basePrice = product.product.price;
    } else {
      // Extract number from string if necessary
      const match = String(product.product.price).match(/\d+/g);
      basePrice = match ? parseInt(match.join(''), 10) : 0;
    }
    
    // Calculate final price taking discounts into account
    let finalPrice = basePrice;
    if (product.discountType && product.discountValue) {
      finalPrice = product.discountType === 'percentage'
        ? basePrice * (1 - product.discountValue / 100)
        : Math.max(0, basePrice - product.discountValue);
    }
    
    productObj.finalPrice = finalPrice;
    
    // Add average rating (default to 0 if no reviews)
    productObj.averageRating = 0;
    
    return productObj;
  });

  // --- ADD: Aggregate average ratings for these products ---
  const vendorProductIds = productsWithDistanceAndPrice.map(p => p._id);
  const ratings = await VendorProductReview.aggregate([
    { $match: { vendorProduct: { $in: vendorProductIds } } },
    { $group: { _id: "$vendorProduct", avg: { $avg: "$rating" } } }
  ]);
  const ratingMap = {};
  ratings.forEach(r => { ratingMap[r._id.toString()] = r.avg; });
  productsWithDistanceAndPrice.forEach(p => {
    p.averageRating = ratingMap[p._id.toString()] || 0;
  });
  // --- END ADD ---

  // Sort products based on sortBy parameter
  const sortedProducts = [...productsWithDistanceAndPrice];
  
  switch (sortBy) {
    case 'nearest':
      sortedProducts.sort((a, b) => a.distance - b.distance);
      break;
    case 'farthest':
      sortedProducts.sort((a, b) => b.distance - a.distance);
      break;
    case 'cheapest':
      sortedProducts.sort((a, b) => a.finalPrice - b.finalPrice);
      break;
    case 'expensive':
      sortedProducts.sort((a, b) => b.finalPrice - a.finalPrice);
      break;
    default:
      // Default to nearest
      sortedProducts.sort((a, b) => a.distance - b.distance);
  }
  
  result.products = sortedProducts;

  // Return combined search results
  return res.json({
    message: `Found ${result.vendors.length} vendors and ${result.products.length} products matching your search`,
    ...result,
  });
});

exports.priceComparison = asyncHandler(async (req, res) => {
  const { name, excludeId, lat, lng, radius = 1 } = req.query;
  if (!name) {
    return res.status(400).json({ message: "Product name is required" });
  }

  // Import required models
  const Vendor = require("../models/Vendor");
  const VendorProduct = require("../models/VendorProduct");

  // 1. Determine coordinates
  let coordinates;
  if (lat && lng) {
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else {
    const customer = await Customer.findById(req.customer.id);
    if (!customer?.location?.coordinates) {
      return res.status(400).json({
        message:
          "No location on file. Provide lat/lng or update your profile address.",
      });
    }
    coordinates = customer.location.coordinates;
  }

  // 2. Convert radius (km) to radians for geo query
  const rad = parseFloat(radius) / 6378.1;

  // 3. Find nearby active vendors
  const nearbyVendors = await Vendor.find({
    isActive: true,
    location: { $geoWithin: { $centerSphere: [coordinates, rad] } },
  }).select("_id");
  if (!nearbyVendors.length) {
    return res.json({ message: "No nearby vendors found", products: [] });
  }
  const vendorIds = nearbyVendors.map((v) => v._id);

  // 4. Build query for VendorProduct
  const query = {
    vendor: { $in: vendorIds },
    inStock: true,
    // exclude the original vendorProduct if requested
    ...(excludeId && { _id: { $ne: excludeId } }),
  };

  // 5. Fetch & populate, matching only exact title
  // Include discount fields in the selection
  let products = await VendorProduct.find(query)
    .populate({ path: "vendor", select: "name location" })
    .populate({
      path: "product",
      match: { title: name },
      select: "title price imageUrl",
    })
    .select("discountType discountValue"); // Make sure to select these fields

  // 6. Filter out any where product didn't match
  products = products.filter((p) => p.product);

  // 7. Calculate final prices with discounts
  const productsWithFinalPrices = products.map((product) => {
    // Create a new object to avoid modifying the original
    const processedProduct = product.toObject
      ? product.toObject()
      : { ...product };

    // Parse base price from the product
    let basePrice = 0;
    if (processedProduct.product) {
      // Handle price as string (e.g., "Rs. 200")
      if (typeof processedProduct.product.price === "string") {
        // Extract numeric values only
        const numericValue = processedProduct.product.price.replace(
          /[^\d]/g,
          ""
        );
        basePrice = parseFloat(numericValue);
      } else if (typeof processedProduct.product.price === "number") {
        basePrice = processedProduct.product.price;
      }
    }

    // Calculate final price based on discount (if any)
    let finalPrice = basePrice;
    if (processedProduct.discountType && processedProduct.discountValue) {
      if (processedProduct.discountType === "percentage") {
        // Apply percentage discount
        finalPrice = basePrice * (1 - processedProduct.discountValue / 100);
      } else if (processedProduct.discountType === "amount") {
        // Apply fixed amount discount
        finalPrice = Math.max(0, basePrice - processedProduct.discountValue);
      }
    }

    // Round prices to 2 decimal places for consistency
    processedProduct.basePrice = parseFloat(basePrice.toFixed(2));
    processedProduct.finalPrice = parseFloat(finalPrice.toFixed(2));
    console.log("parsedProduct", processedProduct);

    return processedProduct;
  });

  // 8. Return comparison list with final prices
  res.json(productsWithFinalPrices);
});

// @desc    Create and search for ration packs
// @route   POST /api/customers/ration-packs
// @access  Private (customer)
exports.createRationPack = asyncHandler(async (req, res) => {
  const { products, lat, lng, radius = 1, sortBy = 'cheapest' } = req.body;
  
  // Validate input
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ 
      message: "Please select at least one product for your ration pack" 
    });
  }
  
  // Get coordinates (either from request or customer profile)
  let coordinates;
  if (lat && lng) {
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else {
    const customer = await Customer.findById(req.customer.id);
    if (!customer?.location?.coordinates) {
      return res.status(400).json({
        message: "No location available. Please provide lat and lng parameters or update your profile with an address."
      });
    }
    coordinates = customer.location.coordinates;
  }
  
  // Convert radius to radians for geo search
  const rad = parseFloat(radius) / 6378.1;
  
  // Import required models
  const Vendor = require("../models/Vendor");
  const VendorProduct = require("../models/VendorProduct");
  
  // Find nearby vendors
  const nearbyVendors = await Vendor.find({
    isActive: true,
    location: { 
      $geoWithin: { 
        $centerSphere: [coordinates, rad] 
      } 
    }
  }).select("_id name location");
  
  if (!nearbyVendors.length) {
    return res.json({ 
      message: "No vendors found nearby", 
      rationPacks: [] 
    });
  }
  
  // Get vendor IDs
  const vendorIds = nearbyVendors.map(v => v._id);
  
  // Create result container for ration packs from each vendor
  const rationPacks = [];
  
  // Process each vendor
  for (const vendor of nearbyVendors) {
    const packItems = [];
    let totalOriginalPrice = 0;
    let totalDiscountedPrice = 0;
    let availableProductsCount = 0;
    
    // Check which products this vendor has
    for (const productTitle of products) {
      // Find this product at this vendor
      const vendorProducts = await VendorProduct.find({
        vendor: vendor._id,
        inStock: true
      }).populate({
        path: "product",
        match: { title: { $regex: productTitle, $options: "i" } },
        select: "title price imageUrl"
      });
      
      // Then filter out any where product didn't match
      const matchingProducts = vendorProducts.filter(vp => vp.product);
      
      // If no products match, add placeholder item
      if (matchingProducts.length === 0) {
        packItems.push({
          productId: null,
          vendorProductId: null,
          title: productTitle,
          imageUrl: null,
          originalPrice: 0,
          discountedPrice: 0,
          discountType: null,
          discountValue: null,
          isAvailable: false
        });
      } else {
        // Use the first matching product
        const vendorProduct = matchingProducts[0];
        availableProductsCount++;
        
        // Parse base price
        let basePrice = 0;
        if (typeof vendorProduct.product.price === "string") {
          // Method 1: Extract all digits and join them (better for "Rs. 200" format)
          const priceStr = vendorProduct.product.price.trim();
          const digits = priceStr.match(/\d+/g);
          if (digits && digits.length > 0) {
            basePrice = parseFloat(digits.join(""));
          } else {
            // Method 2 (fallback): Remove non-numeric except decimal point
            const numericValue = priceStr.replace(/[^0-9.]/g, "");
            basePrice = parseFloat(numericValue);
          }
        } else if (typeof vendorProduct.product.price === "number") {
          basePrice = vendorProduct.product.price;
        }

        // Validate the basePrice
        if (isNaN(basePrice) || basePrice <= 0) {
          basePrice = 100; // Use a reasonable default value
        }

        // Calculate discounted price
        let finalPrice = basePrice;
        if (vendorProduct.discountType && vendorProduct.discountValue) {
          if (vendorProduct.discountType === "percentage") {
            finalPrice = basePrice * (1 - vendorProduct.discountValue / 100);
          } else if (vendorProduct.discountType === "amount") {
            finalPrice = Math.max(0, basePrice - vendorProduct.discountValue);
          }
        }
        
        // Round prices
        basePrice = parseFloat(basePrice.toFixed(2));
        finalPrice = parseFloat(finalPrice.toFixed(2));
        
        // Add to totals
        totalOriginalPrice += basePrice;
        totalDiscountedPrice += finalPrice;
        
        // Add to pack items
        packItems.push({
          productId: vendorProduct.product._id,
          vendorProductId: vendorProduct._id,
          title: vendorProduct.product.title,
          imageUrl: vendorProduct.product.imageUrl,
          originalPrice: basePrice,
          discountedPrice: finalPrice,
          discountType: vendorProduct.discountType,
          discountValue: vendorProduct.discountValue,
          isAvailable: true
        });
      }
    }
    
    // Include vendors that have at least one product
    if (availableProductsCount > 0) {
      rationPacks.push({
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          location: vendor.location
        },
        items: packItems,
        totalOriginalPrice: parseFloat(totalOriginalPrice.toFixed(2)),
        totalDiscountedPrice: parseFloat(totalDiscountedPrice.toFixed(2)),
        savings: parseFloat((totalOriginalPrice - totalDiscountedPrice).toFixed(2)),
        savingsPercentage: totalOriginalPrice > 0 ? 
          parseFloat(((totalOriginalPrice - totalDiscountedPrice) / totalOriginalPrice * 100).toFixed(2)) : 0,
        availableProductsCount,
        requestedProductsCount: products.length
      });
    }
  }
  
  // Sort ration packs based on sortBy parameter
  if (sortBy === 'cheapest') {
    rationPacks.sort((a, b) => a.totalDiscountedPrice - b.totalDiscountedPrice);
  } else if (sortBy === 'expensive') {
    rationPacks.sort((a, b) => b.totalDiscountedPrice - a.totalDiscountedPrice);
  } else if (sortBy === 'nearest' || sortBy === 'farthest') {
    // For nearest/farthest sorting, we need to calculate the distance from user's location
    rationPacks.forEach(pack => {
      const vendorCoords = pack.vendor.location.coordinates;
      if (!vendorCoords) {
        pack.distance = 9999; // Large number for sorting
        return;
      }
      
      // Calculate distance using Haversine formula
      const R = 6371; // Radius of the earth in km
      const lat1 = coordinates[1] * Math.PI / 180; // latitude of user
      const lat2 = vendorCoords[1] * Math.PI / 180; // latitude of vendor
      const latDiff = (vendorCoords[1] - coordinates[1]) * Math.PI / 180;
      const lngDiff = (vendorCoords[0] - coordinates[0]) * Math.PI / 180;
      const a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(lngDiff/2) * Math.sin(lngDiff/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      pack.distance = R * c; // Distance in km
    });
    
    // Sort by distance
    if (sortBy === 'nearest') {
      rationPacks.sort((a, b) => a.distance - b.distance);
    } else { // farthest
      rationPacks.sort((a, b) => b.distance - a.distance);
    }
  }
  
  res.json({
    message: `Found ${rationPacks.length} vendors with some or all of your ration pack items`,
    rationPacks
  });
});
module.exports = exports;
