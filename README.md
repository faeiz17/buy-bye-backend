# Buy-Bye Backend API

A comprehensive Node.js/Express.js backend API for the Buy-Bye grocery delivery platform. This backend provides robust APIs for customer management, vendor operations, order processing, location-based services, and real-time notifications.

## 🏗️ Project Overview

The Buy-Bye backend is a RESTful API built with Express.js and MongoDB, designed to support a multi-vendor grocery delivery platform. It handles user authentication, location-based vendor discovery, order management, real-time notifications, and comprehensive data management for customers, vendors, and products.

## 📁 Project Structure

```
buy-bye-backend/
├── server/                        # Main server application
│   ├── app.js                     # Express app entry point
│   ├── package.json               # Dependencies and scripts
│   ├── vercel.json                # Vercel deployment configuration
│   ├── seed.js                    # Database seeding script
│   ├── seedCategories.js          # Category seeding script
│   ├── config/                    # Configuration files
│   │   └── db.js                  # MongoDB connection
│   ├── models/                    # Mongoose data models
│   │   ├── Customer.js            # Customer model
│   │   ├── Vendor.js              # Vendor model
│   │   ├── User.js                # Admin user model
│   │   ├── Product.js             # Product model
│   │   ├── VendorProduct.js       # Vendor-product relationship
│   │   ├── Category.js            # Product category model
│   │   ├── SubCategory.js         # Product subcategory model
│   │   ├── Order.js               # Order model
│   │   ├── OrderItems.js          # Order items model
│   │   ├── Cart.js                # Shopping cart model
│   │   ├── Review.js              # Product review model
│   │   ├── VendorProductReview.js # Vendor product reviews
│   │   ├── Delivery.js            # Delivery model
│   │   ├── Rider.js               # Delivery rider model
│   │   ├── Geolocation.js         # Location model
│   │   ├── Notification.js        # Notification model
│   │   ├── ProductPriceHistory.js # Price history model
│   │   └── RationPack.js          # Ration pack model
│   ├── controllers/               # Route controllers
│   │   ├── customerController.js  # Customer operations
│   │   ├── vendorController.js    # Vendor operations
│   │   ├── userController.js      # Admin user operations
│   │   ├── productController.js   # Product operations
│   │   ├── vendorProductController.js # Vendor product operations
│   │   ├── categoryController.js  # Category operations
│   │   ├── subCategoryController.js # Subcategory operations
│   │   ├── orderController.js     # Order operations
│   │   ├── customerOrderController.js # Customer order operations
│   │   ├── vendorOrderController.js # Vendor order operations
│   │   ├── cartController.js      # Cart operations
│   │   ├── reviewController.js    # Review operations
│   │   ├── recipeController.js    # Recipe generation
│   │   ├── notificationController.js # Notification operations
│   │   ├── deliveryController.js  # Delivery operations
│   │   └── rationPackController.js # Ration pack operations
│   ├── routes/                    # API route definitions
│   │   ├── customerRoutes.js      # Customer API routes
│   │   ├── vendorRoutes.js        # Vendor API routes
│   │   ├── userRoutes.js          # Admin user routes
│   │   ├── productRoutes.js       # Product API routes
│   │   ├── vendorProductRoutes.js # Vendor product routes
│   │   ├── categoryRoutes.js      # Category API routes
│   │   ├── subCategoryRoutes.js   # Subcategory API routes
│   │   ├── orderRoutes.js         # Order API routes
│   │   ├── customerOrderRoutes.js # Customer order routes
│   │   ├── vendorOrderRoutes.js   # Vendor order routes
│   │   ├── cartRoutes.js          # Cart API routes
│   │   ├── reviewRoutes.js        # Review API routes
│   │   └── recipeRoutes.js        # Recipe API routes
│   ├── middleware/                # Express middleware
│   │   ├── authMiddleware.js      # Authentication middleware
│   │   └── roleMiddleware.js      # Role-based access control
│   ├── utils/                     # Utility functions
│   │   ├── email.js               # Email service utilities
│   │   ├── sms.js                 # SMS service utilities
│   │   ├── geocode.js             # Geocoding utilities
│   │   ├── generateToken.js       # JWT token generation
│   │   └── migrateOrders.js       # Data migration utilities
│   └── seed-data/                 # Database seeding data
│       ├── baby/                  # Baby products data
│       ├── bakery/                # Bakery products data
│       ├── beverages/             # Beverages data
│       ├── Cooking_essentials/    # Cooking essentials data
│       ├── dairy/                 # Dairy products data
│       ├── fresh_food/            # Fresh food data
│       ├── groceries/             # Groceries data
│       ├── health_and_beauty/     # Health & beauty data
│       └── household/             # Household items data
└── buy-bye-admin-panel/           # Admin panel frontend
    └── admin-pannel/              # Admin panel application
```

## 🛠️ Technology Stack

### Core Framework

- **Node.js**: JavaScript runtime environment
- **Express.js**: ^4.21.2 - Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: ^8.14.0 - MongoDB object modeling

### Authentication & Security

- **JSON Web Tokens (JWT)**: ^9.0.2 - Token-based authentication
- **bcrypt**: ^5.1.1 - Password hashing
- **bcryptjs**: ^3.0.2 - Password hashing (alternative)
- **express-validator**: ^7.2.1 - Input validation

### External Services

- **Nodemailer**: ^6.10.1 - Email service
- **Twilio**: ^5.5.2 - SMS service
- **Expo Server SDK**: ^3.15.0 - Push notifications
- **Google Maps API**: Geocoding and location services
- **Groq SDK**: ^0.26.0 - AI recipe generation

### Development Tools

- **Nodemon**: ^3.1.9 - Development server
- **CSV Parser**: ^3.2.0 - CSV data processing
- **Multer**: ^1.4.5-lts.1 - File upload handling
- **CORS**: ^2.8.5 - Cross-origin resource sharing
- **Dotenv**: ^16.4.7 - Environment variable management

### Deployment

- **Vercel**: Serverless deployment platform
- **@vercel/node**: ^3.0.0 - Vercel Node.js runtime

## 🗄️ Database Schema

### Core Models

#### Customer Model

```javascript
{
  name: String,                    // Customer name
  email: String,                   // Unique email
  password: String,                // Hashed password
  phone: String,                   // Optional unique phone
  isEmailVerified: Boolean,        // Email verification status
  emailVerificationToken: String,  // Verification token
  emailVerificationExpires: Date,  // Token expiration
  isActive: Boolean,               // Account status
  lastLogin: Date,                 // Last login timestamp
  location: {                      // GeoJSON Point
    type: "Point",
    coordinates: [Number],         // [longitude, latitude]
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  pushToken: String                // Push notification token
}
```

#### Vendor Model

```javascript
{
  name: String,                    // Vendor name
  email: String,                   // Unique email
  password: String,                // Hashed password
  phone: String,                   // Optional unique phone
  isEmailVerified: Boolean,        // Email verification status
  isPhoneVerified: Boolean,        // Phone verification status
  phoneVerificationCode: String,   // SMS verification code
  phoneVerificationExpires: Date,  // Code expiration
  isActive: Boolean,               // Account status
  location: {                      // GeoJSON Point
    type: "Point",
    coordinates: [Number],         // [longitude, latitude]
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  resetPasswordToken: String,      // Password reset token
  resetPasswordExpires: Date,      // Reset token expiration
  lastLogin: Date                  // Last login timestamp
}
```

#### Order Model

```javascript
{
  orderNumber: String,             // Unique order number
  customer: ObjectId,              // Customer reference
  items: [{                        // Order items array
    product: ObjectId,             // Product reference
    vendor: ObjectId,              // Vendor reference
    vendorProduct: ObjectId,       // Vendor product reference
    quantity: Number,              // Item quantity
    price: Number,                 // Unit price
    discountType: String,          // "percentage" or "amount"
    discountValue: Number,         // Discount value
    totalPrice: Number             // Calculated total
  }],
  deliveryAddress: {               // Delivery location
    type: "Point",
    coordinates: [Number],
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  contactPhone: String,            // Contact phone
  status: String,                  // Order status
  paymentMethod: String,           // Payment method
  paymentStatus: String,           // Payment status
  statusHistory: [{                // Status tracking
    status: String,
    timestamp: Date,
    note: String
  }],
  subtotal: Number,                // Items subtotal
  deliveryFee: Number,             // Delivery charge
  orderDiscount: Number,           // Order-level discount
  total: Number,                   // Final total
  customerNotes: String,           // Customer notes
  estimatedDelivery: Date,         // Estimated delivery time
  actualDelivery: Date             // Actual delivery time
}
```

## 🔐 Authentication System

### JWT Token Structure

```javascript
{
  id: "user_id",                   // User ID
  iat: timestamp,                  // Issued at
  exp: timestamp                   // Expiration time (30 days)
}
```

### Authentication Middleware

- **protectCustomer**: Customer route protection
- **protectVendor**: Vendor route protection
- **protectAdmin**: Admin route protection
- **generateToken**: JWT token generation utility

### Email Verification

- Secure token generation using crypto
- 24-hour token expiration
- HTML email templates
- Development and production email configurations

## 📍 Location Services

### Geocoding Features

- **Forward Geocoding**: Address to coordinates
- **Reverse Geocoding**: Coordinates to address
- **Address Autocomplete**: Location suggestions
- **Google Maps Integration**: Full location services

### Location Utilities

```javascript
// Forward geocoding
geocodeAddress(address) → Location object

// Reverse geocoding
reverseGeocode(lat, lon) → Formatted address

// Address suggestions
suggestAddresses(query) → Address suggestions array
```

### Geospatial Queries

- 2dsphere indexes for efficient location queries
- Distance-based vendor discovery
- Location-based product search
- Radius-based filtering

## 📧 Email Services

### Email Configuration

- **Production**: SendGrid, Mailgun, or Gmail
- **Development**: Ethereal email for testing
- **HTML Templates**: Professional email designs

### Email Types

- **Verification Emails**: Account verification
- **Password Reset**: Secure password reset
- **Notification Emails**: Order updates and notifications

### Email Templates

```javascript
// Verification email template
- Professional HTML design
- Verification button
- Fallback text link
- 24-hour expiration notice

// Password reset template
- Secure reset link
- 1-hour expiration
- Security warnings
```

## 📱 Push Notifications

### Expo Push Notifications

- **Token Management**: Automatic token registration
- **Notification Types**: Order updates, delivery status
- **Deep Linking**: Direct navigation to order details
- **Cross-platform**: iOS, Android, and Web support

### Notification Features

- Real-time order status updates
- Delivery tracking notifications
- Promotional notifications
- Custom notification data

## 🛒 Shopping Cart System

### Cart Features

- **Multi-vendor Support**: Vendor-specific cart items
- **Quantity Management**: Add, update, remove items
- **Price Calculations**: Discount and total calculations
- **Server Synchronization**: Persistent cart data

### Cart Operations

```javascript
// Cart API endpoints
GET /api/cart                    // Get cart items
POST /api/cart                   // Add item to cart
PUT /api/cart/:vendorProductId   // Update item quantity
DELETE /api/cart/:vendorProductId // Remove item
DELETE /api/cart                 // Clear cart
```

## 📦 Order Management

### Order Lifecycle

1. **Pending**: Order placed, awaiting confirmation
2. **Processing**: Order confirmed, being prepared
3. **Out for Delivery**: Order en route
4. **Delivered**: Order completed
5. **Cancelled**: Order cancelled

### Order Features

- **Unique Order Numbers**: Date-based sequential numbering
- **Status Tracking**: Complete status history
- **Payment Integration**: Multiple payment methods
- **Delivery Tracking**: Real-time delivery updates
- **Order Cancellation**: Cancellation with reasons

### Order Calculations

```javascript
// Price calculations
subtotal = sum(item.price * item.quantity);
total = subtotal + deliveryFee - orderDiscount;

// Discount handling
if (discountType === "percentage") {
  finalPrice = price * (1 - discountValue / 100);
} else if (discountType === "amount") {
  finalPrice = Math.max(0, price - discountValue);
}
```

## 🔍 Search & Discovery

### Location-based Search

- **Nearby Vendors**: Distance-based vendor discovery
- **Nearby Products**: Location-aware product search
- **Radius Filtering**: Configurable search radius
- **Distance Sorting**: Nearest-first results

### Search Features

- **Combined Search**: Vendors and products in one query
- **Category Filtering**: Product category filtering
- **Price Comparison**: Cross-vendor price comparison
- **Advanced Filtering**: Multiple filter criteria

### Search API Endpoints

```javascript
// Customer search endpoints
GET / api / customers / nearby - vendors;
GET / api / customers / nearby - products;
GET / api / customers / search - nearby - vendors - products;
GET / api / customers / price - comparison;
```

## 🧪 Recipe Generation

### AI-Powered Recipes

- **Groq AI Integration**: Advanced recipe generation
- **Cart-based Recipes**: Recipes from cart items
- **Ingredient Suggestions**: Missing ingredient recommendations
- **Cooking Instructions**: Step-by-step instructions

### Recipe Features

- **Smart Suggestions**: AI-powered recipe recommendations
- **Ingredient Analysis**: Cart item analysis
- **Cooking Tips**: Helpful cooking instructions
- **Nutritional Info**: Recipe nutritional information

## 📊 Review System

### Review Features

- **Product Reviews**: Customer product reviews
- **Vendor Reviews**: Vendor rating and feedback
- **Rating System**: 1-5 star rating system
- **Review Moderation**: Admin review management

### Review Model

```javascript
{
  customer: ObjectId,             // Customer reference
  vendorProduct: ObjectId,        // Vendor product reference
  rating: Number,                 // 1-5 star rating
  comment: String,                // Review comment
  images: [String],               // Review images
  helpful: Number,                // Helpful votes count
  isVerified: Boolean,            // Verified purchase
  createdAt: Date                 // Review timestamp
}
```

## 🗃️ Data Seeding

### Seed Data Structure

- **Categories**: Product categories (baby, bakery, beverages, etc.)
- **Subcategories**: Product subcategories
- **Products**: Comprehensive product database
- **CSV Import**: Automated CSV data import

### Seeding Process

```javascript
// Automated seeding workflow
1. Read category folders
2. Parse CSV files
3. Extract product data
4. Create database records
5. Handle relationships
```

### Seed Data Categories

- **Baby Products**: Cereals, milk, diapers, wipes
- **Bakery**: Bread, buns, cookies, rusk
- **Beverages**: Tea, coffee, juices, soft drinks
- **Cooking Essentials**: Flour, oil, pulses, rice
- **Dairy**: Milk, cheese, yogurt, eggs
- **Fresh Food**: Fruits, vegetables, meat, seafood
- **Groceries**: Snacks, packaged foods, desserts
- **Health & Beauty**: Personal care products
- **Household**: Cleaning supplies, utensils

## 🔒 Security Features

### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Token Expiration**: 30-day token validity
- **Route Protection**: Middleware-based access control

### Data Security

- **Input Validation**: Express-validator integration
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Cross-origin security

### API Security

- **Rate Limiting**: Request rate limiting
- **Error Handling**: Secure error responses
- **Logging**: Comprehensive request logging
- **Environment Variables**: Secure configuration

## 🚀 API Endpoints

### Customer Endpoints

```javascript
// Authentication
POST /api/customers/register              // Customer registration
POST /api/customers/login                 // Customer login
GET /api/customers/verify-email/:token    // Email verification
POST /api/customers/resend-verification   // Resend verification

// Profile Management
GET /api/customers/profile                // Get profile
PUT /api/customers/profile                // Update profile
POST /api/customers/update-location       // Update location

// Search & Discovery
GET /api/customers/nearby-vendors         // Find nearby vendors
GET /api/customers/nearby-products        // Find nearby products
GET /api/customers/search-nearby-vendors-products // Combined search
GET /api/customers/price-comparison       // Price comparison

// Ration Packs
POST /api/customers/ration-packs          // Create ration pack
GET /api/customers/ration-packs           // Get ration packs
```

### Vendor Endpoints

```javascript
// Authentication
POST /api/vendors/register                // Vendor registration
POST /api/vendors/login                   // Vendor login
GET /api/vendors/verify-email/:token      // Email verification
POST /api/vendors/verify-phone            // Phone verification

// Profile Management
GET /api/vendors/profile                  // Get profile
PUT /api/vendors/profile                  // Update profile
POST /api/vendors/update-location         // Update location

// Product Management
POST /api/vendors/products                // Add product
GET /api/vendors/products                 // Get vendor products
PUT /api/vendors/products/:id             // Update product
DELETE /api/vendors/products/:id          // Delete product
```

### Order Endpoints

```javascript
// Order Management
POST /api/orders                          // Create order
GET /api/orders                           // Get all orders
GET /api/orders/:id                       // Get order details
PUT /api/orders/:id/status                // Update order status

// Customer Orders
GET /api/customer/orders                  // Customer order history
GET /api/customer/orders/:id              // Customer order details
PUT /api/customer/orders/:id/cancel       // Cancel order
GET /api/customer/orders/:id/tracking     // Order tracking

// Vendor Orders
GET /api/vendor/orders                    // Vendor order list
GET /api/vendor/orders/:id                // Vendor order details
PUT /api/vendor/orders/:id/status         // Update order status
```

### Cart Endpoints

```javascript
// Cart Operations
GET /api/cart                             // Get cart
POST /api/cart                            // Add to cart
PUT /api/cart/:vendorProductId            // Update cart item
DELETE /api/cart/:vendorProductId         // Remove from cart
DELETE /api/cart                          // Clear cart
```

### Product Endpoints

```javascript
// Product Management
GET /api/products                         // Get all products
GET /api/products/:id                     // Get product details
GET /api/products/category/:categoryId    // Get by category
GET /api/products/search/:keyword         // Search products

// Vendor Products
GET /api/vendor-products                  // Get vendor products
POST /api/vendor-products                 // Add vendor product
PUT /api/vendor-products/:id              // Update vendor product
DELETE /api/vendor-products/:id           // Delete vendor product
```

### Category Endpoints

```javascript
// Category Management
GET /api/categories                       // Get all categories
GET /api/categories/:id                   // Get category details
POST /api/categories                      // Create category
PUT /api/categories/:id                   // Update category

// Subcategory Management
GET /api/subcategories                    // Get all subcategories
GET /api/subcategories/:id                // Get subcategory details
GET /api/subcategories/by-category/:categoryId // Get by category
```

### Review Endpoints

```javascript
// Review Management
GET /api/reviews                          // Get reviews
POST /api/reviews                         // Create review
PUT /api/reviews/:id                      // Update review
DELETE /api/reviews/:id                   // Delete review
GET /api/reviews/product/:productId       // Get product reviews
```

### Recipe Endpoints

```javascript
// Recipe Generation
POST / api / recipe / generate; // Generate recipe
GET / api / recipe / suggestions; // Get recipe suggestions
```

## 🚀 Deployment

### Vercel Deployment

- **Serverless Functions**: Automatic scaling
- **Environment Variables**: Secure configuration
- **Custom Domains**: Domain configuration
- **Auto-deployment**: Git-based deployment

### Environment Configuration

```javascript
// Required environment variables
MONGO_URI=                    // MongoDB connection string
JWT_SECRET=                   // JWT secret key
EMAIL_SERVICE=                // Email service provider
EMAIL_USERNAME=               // Email username
EMAIL_PASSWORD=               // Email password
FROM_EMAIL=                   // Sender email
FROM_NAME=                    // Sender name
GOOGLE_MAPS_API_KEY=          // Google Maps API key
TWILIO_ACCOUNT_SID=           // Twilio account SID
TWILIO_AUTH_TOKEN=            // Twilio auth token
TWILIO_PHONE_NUMBER=          // Twilio phone number
GROQ_API_KEY=                 // Groq API key
```

### Production Considerations

- **Database Optimization**: Index optimization
- **Caching Strategy**: Response caching
- **Error Monitoring**: Error tracking
- **Performance Monitoring**: API performance tracking
- **Security Headers**: Security configuration

## 🧪 Testing

### API Testing

- **Postman Collections**: API testing collections
- **Unit Testing**: Controller and service testing
- **Integration Testing**: End-to-end API testing
- **Load Testing**: Performance testing

### Test Coverage

- **Authentication**: Login/logout testing
- **CRUD Operations**: Create, read, update, delete
- **Error Handling**: Error response testing
- **Validation**: Input validation testing

## 📈 Performance Optimization

### Database Optimization

- **Indexing**: Strategic database indexing
- **Query Optimization**: Efficient queries
- **Connection Pooling**: Database connection management
- **Aggregation Pipelines**: Complex data operations

### API Optimization

- **Response Caching**: Cache frequently accessed data
- **Pagination**: Large dataset pagination
- **Compression**: Response compression
- **Rate Limiting**: API rate limiting

### Monitoring

- **Request Logging**: Comprehensive request logs
- **Error Tracking**: Error monitoring
- **Performance Metrics**: API performance tracking
- **Health Checks**: System health monitoring

## 🔮 Future Enhancements

### Planned Features

- [ ] **Real-time Chat**: Customer-vendor messaging
- [ ] **Payment Gateway**: Integrated payment processing
- [ ] **Analytics Dashboard**: Business intelligence
- [ ] **Multi-language Support**: Internationalization
- [ ] **Advanced Search**: Elasticsearch integration
- [ ] **Microservices**: Service decomposition
- [ ] **GraphQL API**: Alternative API layer
- [ ] **WebSocket Support**: Real-time communication

### Technical Improvements

- [ ] **Redis Caching**: Advanced caching layer
- [ ] **Message Queues**: Asynchronous processing
- [ ] **API Versioning**: Version control
- [ ] **Documentation**: Auto-generated API docs
- [ ] **Containerization**: Docker support
- [ ] **CI/CD Pipeline**: Automated deployment

## 📄 License

This project is part of the Buy-Bye platform and is proprietary software.

## 👥 Contributing

For development and contribution guidelines, please refer to the project documentation and coding standards.

---

**Buy-Bye Backend** - Powering the future of grocery delivery with robust, scalable, and secure APIs.
