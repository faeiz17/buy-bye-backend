// utils/migrateOrders.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('../models/Order');
const VendorProduct = require('../models/VendorProduct');

// Load environment variables
dotenv.config();

async function migrateOrders() {
  try {
    console.log('Starting order migration...');
    
    // Find all orders that have items without vendorProduct
    const orders = await Order.find({
      'items.vendorProduct': { $exists: false }
    }).populate('items.product').populate('items.vendor');
    
    console.log(`Found ${orders.length} orders that need migration`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const order of orders) {
      let orderModified = false;
      
      for (const item of order.items) {
        if (!item.vendorProduct && item.product && item.vendor) {
          // Try to find the vendorProduct by product and vendor combination
          const vendorProduct = await VendorProduct.findOne({
            product: item.product._id,
            vendor: item.vendor._id
          });
          
          if (vendorProduct) {
            item.vendorProduct = vendorProduct._id;
            orderModified = true;
            console.log(`Found vendorProduct for order ${order._id}, item ${item.product.title}`);
          } else {
            console.warn(`No vendorProduct found for product ${item.product.title} and vendor ${item.vendor.name}`);
            skippedCount++;
          }
        }
      }
      
      if (orderModified) {
        await order.save();
        migratedCount++;
        console.log(`Migrated order ${order._id}`);
      }
    }
    
    console.log(`Migration completed!`);
    console.log(`Migrated: ${migratedCount} orders`);
    console.log(`Skipped: ${skippedCount} items (no vendorProduct found)`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  // Connect to database directly
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateOrders();
    })
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateOrders }; 