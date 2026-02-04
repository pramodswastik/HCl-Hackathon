/**
 * Main Routes Index
 * Aggregates and exports all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/auth', authRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Retail Portal API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refreshToken: 'POST /api/auth/refresh-token',
        verifyEmail: 'GET /api/auth/verify-email/:token',
        resendVerification: 'POST /api/auth/resend-verification',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password/:token',
        getProfile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/me',
        changePassword: 'PUT /api/auth/change-password'
      }
    }
  });
});

module.exports = router;
