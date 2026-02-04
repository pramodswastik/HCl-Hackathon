/**
 * Email Service using Nodemailer
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * Initialize the email transporter
   */
  initialize() {
    // For development, use Ethereal (fake SMTP service)
    // For production, configure your actual SMTP settings
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Development: Use Ethereal (catches all emails)
      // You can also use Mailtrap or similar services
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   */
  async sendEmail({ to, subject, text, html }) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Retail Portal" <noreply@retailportal.com>',
      to,
      subject,
      text,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // In development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email sent:', info.messageId);
        if (nodemailer.getTestMessageUrl(info)) {
          console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
      }
      
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   * @param {string} email - User's email
   * @param {string} firstName - User's first name
   * @param {string} verificationToken - The verification token
   */
  async sendVerificationEmail(email, firstName, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const subject = 'Verify Your Email - Retail Portal';
    
    const text = `
Hello ${firstName},

Welcome to Retail Portal! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The Retail Portal Team
    `.trim();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to Retail Portal!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello <strong>${firstName}</strong>,</p>
    
    <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    
    <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      © ${new Date().getFullYear()} Retail Portal. All rights reserved.
    </p>
  </div>
</body>
</html>
    `.trim();
    
    return this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send password reset email
   * @param {string} email - User's email
   * @param {string} firstName - User's first name
   * @param {string} resetToken - The password reset token
   */
  async sendPasswordResetEmail(email, firstName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request - Retail Portal';
    
    const text = `
Hello ${firstName},

You requested a password reset for your Retail Portal account. Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The Retail Portal Team
    `.trim();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello <strong>${firstName}</strong>,</p>
    
    <p>You requested a password reset for your account. Click the button below to set a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    
    <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      © ${new Date().getFullYear()} Retail Portal. All rights reserved.
    </p>
  </div>
</body>
</html>
    `.trim();
    
    return this.sendEmail({ to: email, subject, text, html });
  }
}

// Export singleton instance
module.exports = new EmailService();
