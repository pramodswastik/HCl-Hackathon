/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  deleteCategoryLogo,
  getCategoryHierarchy,
  updateProductCount
} = require('../controllers/categoryController');

// Middleware
const { authenticate, authorize } = require('../middleware/auth');
const { uploadCategoryLogo } = require('../middleware/upload');
const {
  validate,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoriesSchema
} = require('../validators/categoryValidator');

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  uploadCategoryLogo,
  validate(createCategorySchema, 'body'),
  createCategory
);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with optional filters
 * @access  Public
 */
router.get(
  '/',
  validate(listCategoriesSchema, 'query'),
  getCategories
);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(categoryIdSchema, 'params'),
  getCategoryById
);

/**
 * @route   GET /api/categories/:id/hierarchy
 * @desc    Get category hierarchy (breadcrumb)
 * @access  Public
 */
router.get(
  '/:id/hierarchy',
  validate(categoryIdSchema, 'params'),
  getCategoryHierarchy
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  uploadCategoryLogo,
  validate(categoryIdSchema, 'params'),
  validate(updateCategorySchema, 'body'),
  updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(categoryIdSchema, 'params'),
  deleteCategory
);

/**
 * @route   DELETE /api/categories/:id/logo
 * @desc    Delete category logo
 * @access  Private/Admin
 */
router.delete(
  '/:id/logo',
  authenticate,
  authorize('admin'),
  validate(categoryIdSchema, 'params'),
  deleteCategoryLogo
);

/**
 * @route   PUT /api/categories/:id/product-count
 * @desc    Update category product count (internal use)
 * @access  Private/Admin
 */
router.put(
  '/:id/product-count',
  authenticate,
  authorize('admin'),
  validate(categoryIdSchema, 'params'),
  updateProductCount
);

module.exports = router;
