/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  setPrimaryImage,
  searchProducts,
  updateStock,
  getStockHistory,
  getLowStockProducts,
  getFeaturedProducts,
  getProductsByCategory
} = require('../controllers/productController');

// Middleware
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');
const {
  validate,
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  listProductsSchema,
  searchProductsSchema,
  updateStockSchema
} = require('../validators/productValidator');

/**
 * @route   GET /api/products/search
 * @desc    Search products with fuzzy matching
 * @access  Public
 */
router.get(
  '/search',
  validate(searchProductsSchema, 'query'),
  searchProducts
);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', getFeaturedProducts);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get low stock products
 * @access  Private/Admin
 */
router.get(
  '/low-stock',
  authenticate,
  authorize('admin'),
  getLowStockProducts
);

/**
 * @route   GET /api/products/category/:categoryId
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:categoryId', getProductsByCategory);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', optionalAuth, getProductBySlug);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  uploadProductImages,
  validate(createProductSchema, 'body'),
  createProduct
);

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filters
 * @access  Public (with optional auth for admin features)
 */
router.get(
  '/',
  optionalAuth,
  validate(listProductsSchema, 'query'),
  getProducts
);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public (with optional auth for admin features)
 */
router.get(
  '/:id',
  optionalAuth,
  validate(productIdSchema, 'params'),
  getProductById
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  uploadProductImages,
  validate(productIdSchema, 'params'),
  validate(updateProductSchema, 'body'),
  updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(productIdSchema, 'params'),
  deleteProduct
);

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Delete product image
 * @access  Private/Admin
 */
router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('admin'),
  deleteProductImage
);

/**
 * @route   PUT /api/products/:id/images/:imageId/primary
 * @desc    Set primary product image
 * @access  Private/Admin
 */
router.put(
  '/:id/images/:imageId/primary',
  authenticate,
  authorize('admin'),
  setPrimaryImage
);

/**
 * @route   PUT /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private/Admin
 */
router.put(
  '/:id/stock',
  authenticate,
  authorize('admin'),
  validate(productIdSchema, 'params'),
  validate(updateStockSchema, 'body'),
  updateStock
);

/**
 * @route   GET /api/products/:id/stock/history
 * @desc    Get stock history for a product
 * @access  Private/Admin
 */
router.get(
  '/:id/stock/history',
  authenticate,
  authorize('admin'),
  validate(productIdSchema, 'params'),
  getStockHistory
);

module.exports = router;
