/**
 * Main Routes Index
 * Aggregates and exports all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

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
      },
      products: {
        create: 'POST /api/products (Admin)',
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        getBySlug: 'GET /api/products/slug/:slug',
        getByCategory: 'GET /api/products/category/:categoryId',
        search: 'GET /api/products/search?q=query',
        featured: 'GET /api/products/featured',
        update: 'PUT /api/products/:id (Admin)',
        delete: 'DELETE /api/products/:id (Admin)',
        deleteImage: 'DELETE /api/products/:id/images/:imageId (Admin)',
        setPrimaryImage: 'PUT /api/products/:id/images/:imageId/primary (Admin)',
        updateStock: 'PUT /api/products/:id/stock (Admin)',
        stockHistory: 'GET /api/products/:id/stock/history (Admin)',
        lowStock: 'GET /api/products/low-stock (Admin)'
      }
    }
  });
});

module.exports = router;
