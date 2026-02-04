/**
 * Authentication and Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const { UnauthorizedError, ForbiddenError, asyncHandler } = require('./errorHandler');

/**
 * Verify JWT access token and attach user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Access denied. No token provided.');
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new UnauthorizedError('User not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token.');
    }
    throw error;
  }
});

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid or expired, continue without user
    }
  }

  next();
});

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required.');
  }

  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Access denied. Admin privileges required.');
  }

  next();
};

/**
 * Check if user is the resource owner or admin
 * @param {string} userIdParam - The request parameter name containing the user ID
 */
const isOwnerOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    const resourceUserId = req.params[userIdParam];
    const isOwner = req.user._id.toString() === resourceUserId;
    const isUserAdmin = req.user.role === 'admin';

    if (!isOwner && !isUserAdmin) {
      throw new ForbiddenError('Access denied. You can only access your own resources.');
    }

    next();
  };
};

/**
 * Check if email is verified
 */
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required.');
  }

  if (!req.user.isEmailVerified) {
    throw new ForbiddenError('Please verify your email address to access this resource.');
  }

  next();
};

/**
 * Generate JWT tokens for a user
 * @param {Object} user - The user object
 * @returns {Object} - Access and refresh tokens
 */
const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expiresIn
  });

  const refreshToken = jwt.sign(
    { userId: user._id },
    jwtConfig.refreshToken.secret,
    { expiresIn: jwtConfig.refreshToken.expiresIn }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify refresh token
 * @param {string} token - The refresh token
 * @returns {Object} - Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refreshToken.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Refresh token has expired. Please login again.');
    }
    throw new UnauthorizedError('Invalid refresh token.');
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  isAdmin,
  isOwnerOrAdmin,
  requireVerifiedEmail,
  generateTokens,
  verifyRefreshToken
};
