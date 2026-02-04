/**
 * File Upload Middleware using Multer
 */

const multer = require('multer');
const path = require('path');
const { ValidationError } = require('./errorHandler');

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}`
      ),
      false
    );
  }
};

/**
 * Multer configuration for memory storage
 * Files are stored in memory as Buffer for S3 upload
 */
const memoryStorage = multer.memoryStorage();

/**
 * Upload middleware for category logo
 */
const uploadCategoryLogo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: imageFileFilter
}).single('logo');

/**
 * Upload middleware for product images (multiple)
 * Allows up to 10 images per product
 */
const MAX_PRODUCT_IMAGES = 10;

const uploadProductImagesMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_PRODUCT_IMAGES
  },
  fileFilter: imageFileFilter
}).array('images', MAX_PRODUCT_IMAGES);

/**
 * Wrapper to handle multer errors
 */
const handleUpload = (uploadMiddleware, maxFiles = 1) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: `Too many files. Maximum ${maxFiles} file(s) allowed`
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected field name for file upload'
            });
          }
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        
        if (err instanceof ValidationError) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadCategoryLogo: handleUpload(uploadCategoryLogo, 1),
  uploadProductImages: handleUpload(uploadProductImagesMulter, MAX_PRODUCT_IMAGES),
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_PRODUCT_IMAGES
};
