/**
 * Authentication Controller
 */

const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const jwtConfig = require('../config/jwt');
const {
  generateTokens,
  verifyRefreshToken
} = require('../middleware/auth');
const {
  asyncHandler,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError
} = require('../middleware/errorHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    throw new ValidationError('Please provide all required fields: firstName, lastName, email, password');
  }

  // Validate email format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Please provide a valid email address');
  }

  // Validate password strength
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Create user
  const user = new User({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();

  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails, but log it
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, jwtConfig.cookieOptions);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      accessToken
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ValidationError('Please provide email and password');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, jwtConfig.cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      accessToken
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    throw new UnauthorizedError('No refresh token provided');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(token);

  // Find user
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('User account is deactivated');
  }

  // Generate new tokens
  const tokens = generateTokens(user);

  // Set new refresh token in cookie
  res.cookie('refreshToken', tokens.refreshToken, jwtConfig.cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: tokens.accessToken
    }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.cookie('refreshToken', '', {
    ...jwtConfig.cookieOptions,
    maxAge: 0
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ValidationError('Verification token is required');
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ValidationError('Invalid or expired verification token');
  }

  // Update user
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.isEmailVerified) {
    throw new ValidationError('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

  res.status(200).json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Please provide an email address');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Don't reveal if user exists or not
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
  } catch (error) {
    // Reset the token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error('Failed to send password reset email. Please try again later.');
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw new ValidationError('Reset token is required');
  }

  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.'
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    }
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, addresses } = req.body;

  // Fields that are allowed to be updated
  const updates = {};
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (addresses) updates.addresses = addresses;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        isEmailVerified: user.isEmailVerified
      }
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Please provide current password and new password');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new tokens
  const tokens = generateTokens(user);

  // Set new refresh token
  res.cookie('refreshToken', tokens.refreshToken, jwtConfig.cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: {
      accessToken: tokens.accessToken
    }
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword
};
