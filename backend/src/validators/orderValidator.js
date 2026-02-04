/**
 * Order Validation Schemas
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
 * Schema for order item add-on
 */
const orderAddOnSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Add-on name is required',
      'any.required': 'Add-on name is required'
    })
});

/**
 * Schema for order item
 */
const orderItemSchema = Joi.object({
  product: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .required()
    .messages({
      'any.invalid': 'Invalid product ID',
      'any.required': 'Product ID is required'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 100',
      'any.required': 'Quantity is required'
    }),
  addOns: Joi.array()
    .items(orderAddOnSchema)
    .optional()
    .default([])
});

/**
 * Schema for address
 */
const addressSchema = Joi.object({
  street: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Street address is required',
      'string.min': 'Street address must be at least 5 characters',
      'string.max': 'Street address cannot exceed 200 characters',
      'any.required': 'Street address is required'
    }),
  city: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'City is required',
      'string.min': 'City must be at least 2 characters',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
  state: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'State is required',
      'string.min': 'State must be at least 2 characters',
      'string.max': 'State cannot exceed 100 characters',
      'any.required': 'State is required'
    }),
  zipCode: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.empty': 'Zip code is required',
      'string.min': 'Zip code must be at least 3 characters',
      'string.max': 'Zip code cannot exceed 20 characters',
      'any.required': 'Zip code is required'
    }),
  country: Joi.string()
    .trim()
    .max(100)
    .optional()
    .default('USA'),
  phone: Joi.string()
    .trim()
    .max(20)
    .optional()
});

/**
 * Schema for coupon
 */
const couponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'string.empty': 'Coupon code is required',
      'any.required': 'Coupon code is required'
    }),
  discount: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min': 'Discount must be positive',
      'any.required': 'Discount amount is required'
    }),
  type: Joi.string()
    .valid('percentage', 'fixed')
    .required()
    .messages({
      'any.only': 'Coupon type must be either "percentage" or "fixed"',
      'any.required': 'Coupon type is required'
    })
});

/**
 * Schema for tracking information
 */
const trackingSchema = Joi.object({
  carrier: Joi.string()
    .trim()
    .max(100)
    .optional(),
  trackingNumber: Joi.string()
    .trim()
    .max(100)
    .optional(),
  estimatedDelivery: Joi.date()
    .optional()
});

/**
 * Schema for creating a new order
 */
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Order items are required'
    }),
  shippingAddress: addressSchema
    .required()
    .messages({
      'any.required': 'Shipping address is required'
    }),
  billingAddress: addressSchema
    .optional(),
  paymentMethod: Joi.string()
    .valid('credit_card', 'debit_card', 'paypal', 'cash_on_delivery')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required'
    }),
  shippingCost: Joi.number()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Shipping cost cannot be negative'
    }),
  coupon: couponSchema
    .optional(),
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

/**
 * Schema for listing orders
 */
const listOrdersSchema = Joi.object({
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
    .default(10),
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    .optional(),
  paymentStatus: Joi.string()
    .valid('pending', 'paid', 'failed', 'refunded')
    .optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'pricing.total', 'status')
    .optional()
    .default('createdAt'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc'),
  all: Joi.string()
    .valid('true', 'false')
    .optional(),
  userId: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .optional()
});

/**
 * Schema for order ID parameter
 */
const orderIdSchema = Joi.object({
  id: Joi.string()
    .custom(objectIdValidator, 'ObjectId validation')
    .required()
    .messages({
      'any.invalid': 'Invalid order ID',
      'any.required': 'Order ID is required'
    })
});

/**
 * Schema for updating order status
 */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    .required()
    .messages({
      'any.only': 'Invalid order status',
      'any.required': 'Status is required'
    }),
  note: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Note cannot exceed 500 characters'
    }),
  tracking: trackingSchema
    .optional()
});

/**
 * Schema for order statistics query
 */
const orderStatsSchema = Joi.object({
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    })
});

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = property === 'body' ? req.body : 
                          property === 'query' ? req.query : req.params;
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace with validated and sanitized values
    if (property === 'body') {
      req.body = value;
    } else if (property === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
};

module.exports = {
  validate,
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  updateOrderStatusSchema,
  orderStatsSchema
};
