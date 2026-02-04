/**
 * User Routes (Admin)
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
} = require('../controllers/userController');

// Middleware
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/users/admin/all
 * @desc    Get all users for admin (paginated)
 * @access  Private/Admin
 */
router.get('/admin/all', getAllUsers);

/**
 * @route   GET /api/users/admin/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/admin/:id', getUserById);

/**
 * @route   PUT /api/users/admin/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private/Admin
 */
router.put('/admin/:id/status', updateUserStatus);

module.exports = router;
