// utils/sms.js
const twilio = require("twilio");

/**
 * Configure SMS client
 * For production, this uses Twilio
 * For development, it logs messages to console
 */
const createSmsClient = () => {
  // For production
  if (process.env.NODE_ENV === "production") {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // For development/testing
  return {
    messages: {
      create: async ({ body, from, to }) => {
        console.log(
          `[SMS SIMULATION] From: ${from}, To: ${to}, Message: ${body}`
        );
        return { sid: "DEV-SMS-SID-" + Date.now() };
      },
    },
  };
};

/**
 * Send SMS using configured provider
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<object>} - SMS sending result
 */
exports.sendSMS = async (to, message) => {
  try {
    const client = createSmsClient();

    // Format phone number if needed
    const formattedNumber = to.startsWith("+") ? to : `+${to}`;

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });

    return result;
  } catch (error) {
    console.error("SMS sending error:", error);
    throw new Error("Failed to send SMS verification code");
  }
};

/**
 * Send phone verification code
 * @param {string} to - Recipient phone number
 * @param {string} code - Verification code
 * @returns {Promise<object>} - SMS sending result
 */
exports.sendVerificationCode = async (to, code) => {
  const message = `Your verification code is: ${code}. This code will expire in 10 minutes.`;
  return await exports.sendSMS(to, message);
};

/**
 * Send alert notification via SMS
 * @param {string} to - Recipient phone number
 * @param {string} message - Alert message
 * @returns {Promise<object>} - SMS sending result
 */
exports.sendAlertSMS = async (to, message) => {
  const alertMessage = `ALERT: ${message}`;
  return await exports.sendSMS(to, alertMessage);
};

/**
 * Send batch SMS messages
 * @param {Array<{to: string, message: string}>} batch - Array of recipient and message objects
 * @returns {Promise<Array>} - Array of SMS sending results
 */
exports.sendBatchSMS = async (batch) => {
  try {
    const results = await Promise.all(
      batch.map((item) => exports.sendSMS(item.to, item.message))
    );
    return results;
  } catch (error) {
    console.error("Batch SMS sending error:", error);
    throw new Error("Failed to send batch SMS messages");
  }
};
