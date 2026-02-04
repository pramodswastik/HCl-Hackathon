/**
 * JWT Configuration
 */

module.exports = {
  // Access token configuration
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' // 15 minutes
  },
  
  // Refresh token configuration
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' // 7 days
  },
  
  // Cookie options for refresh token
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }
};
