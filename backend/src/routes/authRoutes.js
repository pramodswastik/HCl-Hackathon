/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// ======================
// Public Routes
// ======================

// Registration & Login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Token Management
router.post('/refresh-token', authController.refreshToken);

// Email Verification
router.get('/verify-email/:token', authController.verifyEmail);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// ======================
// Protected Routes
// ======================

// Logout (requires auth to invalidate token)
router.post('/logout', authenticate, authController.logout);

// Email Verification
router.post('/resend-verification', authenticate, authController.resendVerificationEmail);

// User Profile
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);

// Password Change
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
