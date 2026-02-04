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
const unifiedProductRoutes = require('./unifiedProductRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/products', unifiedProductRoutes); // Unified product API
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);

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
        unified: 'POST /api/products/unified - Consolidated API for all product operations',
        create: 'POST /api/products (Admin) [Legacy]',
        list: 'GET /api/products [Legacy]',
        get: 'GET /api/products/:id [Legacy]',
        getBySlug: 'GET /api/products/slug/:slug [Legacy]',
        getByCategory: 'GET /api/products/category/:categoryId [Legacy]',
        search: 'GET /api/products/search?q=query [Legacy]',
        featured: 'GET /api/products/featured [Legacy]',
        update: 'PUT /api/products/:id (Admin) [Legacy]',
        delete: 'DELETE /api/products/:id (Admin) [Legacy]',
        deleteImage: 'DELETE /api/products/:id/images/:imageId (Admin) [Legacy]',
        setPrimaryImage: 'PUT /api/products/:id/images/:imageId/primary (Admin) [Legacy]',
        updateStock: 'PUT /api/products/:id/stock (Admin) [Legacy]',
        stockHistory: 'GET /api/products/:id/stock/history (Admin) [Legacy]',
        lowStock: 'GET /api/products/low-stock (Admin) [Legacy]'
      },
      orders: {
        create: 'POST /api/orders',
        list: 'GET /api/orders',
        get: 'GET /api/orders/:id',
        updateStatus: 'PUT /api/orders/:id/status (Admin)',
        reorder: 'POST /api/orders/:id/reorder',
        stats: 'GET /api/orders/stats (Admin)',
        history: 'GET /api/orders/history'
      }
    }
  });
});

module.exports = router;
