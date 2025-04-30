// utils/email.js
const nodemailer = require("nodemailer");

/**
 * Configure email transporter
 * In production, you would use a service like SendGrid, Mailgun, etc.
 * For development, you can use a test account from Ethereal:
 * https://ethereal.email/create
 */
const createTransporter = async () => {
  // For production
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'SendGrid', 'Gmail'
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // For development/testing (using Ethereal)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
};

/**
 * Send verification email to vendor
 * @param {string} email - Recipient email address
 * @param {string} token - Verification token
 * @param {string} name - Vendor name
 * @returns {Promise<object>} - Email sending result
 */
exports.sendVerificationEmail = async (email, token, name) => {
  try {
    const transporter = await createTransporter();

    // Create verification URL
    const verificationUrl = `http://localhost:5000/api/vendors/verify-email/${token}`;

    // Email content
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Please verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with our platform. Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>If you did not create an account, please ignore this email.</p>
          
          <p>Best regards,<br/>The Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log URL for development environment
    if (process.env.NODE_ENV !== "production") {
      console.log("Verification URL:", verificationUrl);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} token - Reset token
 * @param {string} name - Vendor name
 * @returns {Promise<object>} - Email sending result
 */
exports.sendPasswordResetEmail = async (email, token, name) => {
  try {
    const transporter = await createTransporter();

    // Create reset URL
    const resetUrl = `${process.env.BASE_URL}/reset-password/${token}`;

    // Email content
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>You requested a password reset. Please click the button below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4285F4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          
          <p>This password reset link will expire in 1 hour.</p>
          
          <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
          
          <p>Best regards,<br/>The Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log URL for development environment
    if (process.env.NODE_ENV !== "production") {
      console.log("Reset URL:", resetUrl);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send notification email
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {string} name - Recipient name
 * @returns {Promise<object>} - Email sending result
 */
exports.sendNotificationEmail = async (email, subject, message, name) => {
  try {
    const transporter = await createTransporter();

    // Email content
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>${message}</p>
          <p>Best regards,<br/>The Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send notification email");
  }
};
