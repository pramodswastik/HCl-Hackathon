/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  reorder,
  getOrderStats,
  getOrderHistory
} = require('../controllers/orderController');

// Middleware
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  updateOrderStatusSchema,
  orderStatsSchema
} = require('../validators/orderValidator');

// All order routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics (Admin only)
 * @access  Private/Admin
 */
router.get(
  '/stats',
  authorize('admin'),
  validate(orderStatsSchema, 'query'),
  getOrderStats
);

/**
 * @route   GET /api/orders/history
 * @desc    Get user's order history summary
 * @access  Private
 */
router.get('/history', getOrderHistory);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post(
  '/',
  validate(createOrderSchema, 'body'),
  createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the authenticated user (paginated)
 * @access  Private
 */
router.get(
  '/',
  validate(listOrdersSchema, 'query'),
  getOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(orderIdSchema, 'params'),
  getOrderById
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (Admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id/status',
  authorize('admin'),
  validate(orderIdSchema, 'params'),
  validate(updateOrderStatusSchema, 'body'),
  updateOrderStatus
);

/**
 * @route   POST /api/orders/:id/reorder
 * @desc    Quick re-order - Create a new order from a previous order
 * @access  Private
 */
router.post(
  '/:id/reorder',
  validate(orderIdSchema, 'params'),
  reorder
);

module.exports = router;
