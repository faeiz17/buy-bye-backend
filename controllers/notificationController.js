// server/controllers/notificationController.js
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");
const { Expo } = require('expo-server-sdk');

// Initialize Expo SDK
let expo = new Expo();

// @desc    Save customer push token
// @route   POST /api/customers/push-token
// @access  Private (customer)
exports.savePushToken = asyncHandler(async (req, res) => {
  const customerId = req.customer.id;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  // Validate the token
  if (!Expo.isExpoPushToken(token)) {
    return res.status(400).json({ message: "Invalid Expo push token" });
  }

  // Update customer with the push token
  await Customer.findByIdAndUpdate(
    customerId,
    { pushToken: token },
    { new: true }
  );

  res.status(200).json({ message: "Push token saved successfully" });
});

// Helper function to send push notifications
exports.sendPushNotification = async (customerId, title, body, data = {}) => {
  try {
    // Get customer's push token
    const customer = await Customer.findById(customerId).select('pushToken');
    
    if (!customer || !customer.pushToken) {
      return { success: false, message: 'No push token found for customer' };
    }
    
    const pushToken = customer.pushToken;
    
    // Create the notification message
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    // Use Expo's API to send the notification
    let chunks = expo.chunkPushNotifications([message]);
    let tickets = [];
    
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }
    
    return { success: true, tickets };
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = exports;