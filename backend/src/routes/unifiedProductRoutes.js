/**
 * Unified Product Routes
 * Single endpoint for all product operations
 */

const express = require('express');
const router = express.Router();

// Controllers
const { unifiedProductHandler } = require('../controllers/unifiedProductController');

// Middleware
const { optionalAuth } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');

/**
 * @route   POST /api/products/unified
 * @desc    Unified product API - handles all product operations
 * @access  Public/Private (depends on operation)
 * 
 * Request body:
 * {
 *   "operation": "OPERATION_TYPE",
 *   "data": { ... operation-specific data ... }
 * }
 * 
 * Supported Operations:
 * - GET_ALL: Get all products with filters { page, limit, category, status, minPrice, maxPrice, inStock, isFeatured, isCombo, search, sortBy, sortOrder }
 * - GET_BY_ID: Get product by ID { id }
 * - GET_BY_SLUG: Get product by slug { slug }
 * - SEARCH: Search products { query, page, limit, category, minPrice, maxPrice, inStock, sortBy, sortOrder }
 * - GET_FEATURED: Get featured products { limit }
 * - GET_BY_CATEGORY: Get by category { categoryId, page, limit, sortBy, sortOrder }
 * - GET_LOW_STOCK: Get low stock (Admin) { page, limit }
 * - CREATE: Create product (Admin) { name, sku, description, price, category, ... }
 * - UPDATE: Update product (Admin) { id, ...updateFields }
 * - DELETE: Delete product (Admin) { id }
 * - DELETE_IMAGE: Delete image (Admin) { productId, imageId }
 * - SET_PRIMARY_IMAGE: Set primary image (Admin) { productId, imageId }
 * - UPDATE_STOCK: Update stock (Admin) { id, quantity, operation, reason }
 * - GET_STOCK_HISTORY: Get stock history (Admin) { id }
 */
router.post(
  '/unified',
  optionalAuth,
  uploadProductImages,
  unifiedProductHandler
);

module.exports = router;
