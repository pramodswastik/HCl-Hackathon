/**
 * Main Routes Index
 * Aggregates and exports all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

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
      },
      categories: {
        create: 'POST /api/categories (Admin)',
        list: 'GET /api/categories',
        get: 'GET /api/categories/:id',
        getHierarchy: 'GET /api/categories/:id/hierarchy',
        update: 'PUT /api/categories/:id (Admin)',
        delete: 'DELETE /api/categories/:id (Admin)',
        deleteLogo: 'DELETE /api/categories/:id/logo (Admin)'
      }
    }
  });
});

module.exports = router;
