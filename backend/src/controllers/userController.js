/**
 * User Controller (Admin)
 * Handles admin user management operations
 */

const User = require('../models/User');
const {
  asyncHandler,
  NotFoundError,
  ValidationError
} = require('../middleware/errorHandler');

/**
 * @desc    Get all users for admin (paginated)
 * @route   GET /api/users/admin/all
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};

  // Filter by status
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Search by name or email
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total: total,
      limit: limitNum,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    }
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/admin/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
    .lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PUT /api/users/admin/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ValidationError('isActive must be a boolean');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString() && !isActive) {
    throw new ValidationError('You cannot deactivate your own account');
  }

  user.isActive = isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      _id: user._id,
      isActive: user.isActive
    }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus
};
