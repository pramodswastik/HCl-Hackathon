/**
 * Product Validation Schemas
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
 * Schema for product add-on
 */
const addOnSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Add-on name is required',
      'string.min': 'Add-on name must be at least 1 character',
      'string.max': 'Add-on name cannot exceed 100 characters',
      'any.required': 'Add-on name is required'
    }),
  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Add-on price must be a number',
      'number.min': 'Add-on price cannot be negative',
      'any.required': 'Add-on price is required'
    }),
  isAvailable: Joi.boolean()
    .optional()
    .default(true)
});

/**
 * Schema for combo item
 */
const comboItemSchema = Joi.object({
  product: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .required()
    .messages({
      'any.invalid': 'Invalid product ID in combo items',
      'any.required': 'Product ID is required for combo items'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Combo item quantity must be a number',
      'number.min': 'Combo item quantity must be at least 1'
    })
});

/**
 * Schema for product attributes
 */
const attributeSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  value: Joi.string().trim().max(500).required()
});

/**
 * Schema for creating a new product
 */
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name cannot exceed 200 characters',
      'any.required': 'Product name is required'
    }),

  sku: Joi.string()
    .trim()
    .uppercase()
    .max(50)
    .optional()
    .messages({
      'string.max': 'SKU cannot exceed 50 characters'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),

  shortDescription: Joi.string()
    .trim()
    .max(300)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Short description cannot exceed 300 characters'
    }),

  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required'
    }),

  compareAtPrice: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Compare at price must be a number',
      'number.min': 'Compare at price cannot be negative'
    }),

  costPrice: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Cost price must be a number',
      'number.min': 'Cost price cannot be negative'
    }),

  category: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .required()
    .messages({
      'any.invalid': 'Invalid category ID',
      'any.required': 'Category is required'
    }),

  stock: Joi.object({
    quantity: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Stock quantity must be a number',
        'number.min': 'Stock quantity cannot be negative'
      }),
    lowStockThreshold: Joi.number()
      .integer()
      .min(0)
      .default(10)
      .messages({
        'number.base': 'Low stock threshold must be a number',
        'number.min': 'Low stock threshold cannot be negative'
      }),
    trackInventory: Joi.boolean()
      .default(true)
  }).optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'draft', 'archived')
    .default('draft')
    .messages({
      'any.only': 'Status must be one of: active, inactive, draft, archived'
    }),

  isCombo: Joi.boolean()
    .default(false),

  comboItems: Joi.array()
    .items(comboItemSchema)
    .when('isCombo', {
      is: true,
      then: Joi.array().min(2).required().messages({
        'array.min': 'Combo products must have at least 2 items',
        'any.required': 'Combo items are required when isCombo is true'
      }),
      otherwise: Joi.array().max(0)
    }),

  addOns: Joi.array()
    .items(addOnSchema)
    .optional(),

  attributes: Joi.array()
    .items(attributeSchema)
    .optional(),

  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .optional(),

  weight: Joi.object({
    value: Joi.number().min(0),
    unit: Joi.string().valid('kg', 'g', 'lb', 'oz').default('kg')
  }).optional(),

  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
    unit: Joi.string().valid('cm', 'in', 'm').default('cm')
  }).optional(),

  seo: Joi.object({
    metaTitle: Joi.string().max(100),
    metaDescription: Joi.string().max(200),
    keywords: Joi.array().items(Joi.string().max(50))
  }).optional(),

  isFeatured: Joi.boolean()
    .default(false)
});

/**
 * Schema for updating a product
 */
const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name cannot exceed 200 characters'
    }),

  sku: Joi.string()
    .trim()
    .uppercase()
    .max(50)
    .optional(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional(),

  shortDescription: Joi.string()
    .trim()
    .max(300)
    .allow('')
    .optional(),

  price: Joi.number()
    .min(0)
    .optional(),

  compareAtPrice: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  costPrice: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  category: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .optional()
    .messages({
      'any.invalid': 'Invalid category ID'
    }),

  stock: Joi.object({
    quantity: Joi.number().integer().min(0),
    lowStockThreshold: Joi.number().integer().min(0),
    trackInventory: Joi.boolean()
  }).optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'draft', 'archived')
    .optional(),

  isCombo: Joi.boolean()
    .optional(),

  comboItems: Joi.array()
    .items(comboItemSchema)
    .optional(),

  addOns: Joi.array()
    .items(addOnSchema)
    .optional(),

  attributes: Joi.array()
    .items(attributeSchema)
    .optional(),

  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .optional(),

  weight: Joi.object({
    value: Joi.number().min(0),
    unit: Joi.string().valid('kg', 'g', 'lb', 'oz')
  }).optional(),

  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
    unit: Joi.string().valid('cm', 'in', 'm')
  }).optional(),

  seo: Joi.object({
    metaTitle: Joi.string().max(100),
    metaDescription: Joi.string().max(200),
    keywords: Joi.array().items(Joi.string().max(50))
  }).optional(),

  isFeatured: Joi.boolean()
    .optional()
});

/**
 * Schema for product ID parameter
 */
const productIdSchema = Joi.object({
  id: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .required()
    .messages({
      'any.invalid': 'Invalid product ID',
      'any.required': 'Product ID is required'
    })
});

/**
 * Schema for listing products
 */
const listProductsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),

  category: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .optional()
    .messages({
      'any.invalid': 'Invalid category ID'
    }),

  status: Joi.string()
    .valid('active', 'inactive', 'draft', 'archived')
    .optional(),

  minPrice: Joi.number()
    .min(0)
    .optional(),

  maxPrice: Joi.number()
    .min(0)
    .optional(),

  inStock: Joi.boolean()
    .optional(),

  isFeatured: Joi.boolean()
    .optional(),

  isCombo: Joi.boolean()
    .optional(),

  search: Joi.string()
    .trim()
    .max(200)
    .optional(),

  sortBy: Joi.string()
    .valid('name', 'price', 'createdAt', 'updatedAt', 'stock.quantity')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

/**
 * Schema for search products
 */
const searchProductsSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query cannot exceed 200 characters',
      'any.required': 'Search query is required'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  category: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .optional(),

  minPrice: Joi.number()
    .min(0)
    .optional(),

  maxPrice: Joi.number()
    .min(0)
    .optional(),

  inStock: Joi.boolean()
    .optional(),

  sortBy: Joi.string()
    .valid('relevance', 'name', 'price', 'createdAt')
    .default('relevance'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

/**
 * Schema for updating stock
 */
const updateStockSchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'any.required': 'Quantity is required'
    }),

  operation: Joi.string()
    .valid('set', 'add', 'subtract')
    .default('set')
    .messages({
      'any.only': 'Operation must be one of: set, add, subtract'
    }),

  reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    })
});

/**
 * Schema for deleting product image
 */
const deleteImageSchema = Joi.object({
  imageId: Joi.string()
    .required()
    .messages({
      'any.required': 'Image ID is required'
    })
});

/**
 * Validation middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // Parse JSON strings in body for multipart/form-data requests
    if (property === 'body' && req.body) {
      ['stock', 'addOns', 'comboItems', 'attributes', 'tags', 'weight', 'dimensions', 'seo'].forEach(field => {
        if (typeof req.body[field] === 'string') {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            // Keep original value if parse fails
          }
        }
      });
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  validate,
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  listProductsSchema,
  searchProductsSchema,
  updateStockSchema,
  deleteImageSchema
};
