/**
 * Category Validation Schemas
 */

const Joi = require('joi');
const mongoose = require('mongoose');

// Custom validator for MongoDB ObjectId
const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

/**
 * Schema for creating a new category
 */
const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name cannot exceed 100 characters',
      'any.required': 'Category name is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  parent: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .allow(null)
    .optional()
    .messages({
      'any.invalid': 'Invalid parent category ID'
    }),

  isActive: Joi.boolean()
    .optional()
    .default(true),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Display order must be a number',
      'number.integer': 'Display order must be an integer',
      'number.min': 'Display order cannot be negative'
    })
});

/**
 * Schema for updating a category
 */
const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  parent: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .allow(null)
    .optional()
    .messages({
      'any.invalid': 'Invalid parent category ID'
    }),

  isActive: Joi.boolean()
    .optional(),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Display order must be a number',
      'number.integer': 'Display order must be an integer',
      'number.min': 'Display order cannot be negative'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Schema for category ID parameter
 */
const categoryIdSchema = Joi.object({
  id: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .required()
    .messages({
      'any.invalid': 'Invalid category ID',
      'any.required': 'Category ID is required'
    })
});

/**
 * Schema for listing categories with filters
 */
const listCategoriesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  isActive: Joi.boolean()
    .optional(),

  parent: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .allow(null, 'null')
    .optional(),

  search: Joi.string()
    .trim()
    .max(100)
    .optional(),

  sortBy: Joi.string()
    .valid('name', 'displayOrder', 'createdAt', 'updatedAt')
    .optional()
    .default('displayOrder'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc'),

  tree: Joi.boolean()
    .optional()
    .default(false)
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoriesSchema,
  validate
};
