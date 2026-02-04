const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    images: [
      {
        url: {
          type: String,
          required: true
        },
        publicId: String,
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false
        }
      }
    ],
    stock: {
      quantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
      },
      lowStockThreshold: {
        type: Number,
        default: 10
      },
      trackInventory: {
        type: Boolean,
        default: true
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'archived'],
      default: 'draft'
    },
    isCombo: {
      type: Boolean,
      default: false
    },
    comboItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity: {
          type: Number,
          default: 1
        }
      }
    ],
    addOns: [
      {
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        isAvailable: {
          type: Boolean,
          default: true
        }
      }
    ],
    attributes: [
      {
        name: String,
        value: String
      }
    ],
    tags: [String],
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'g', 'lb', 'oz'],
        default: 'kg'
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'm'],
        default: 'cm'
      }
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    stockHistory: [
      {
        previousQuantity: Number,
        newQuantity: Number,
        change: Number,
        operation: {
          type: String,
          enum: ['set', 'add', 'subtract'],
          default: 'set'
        },
        reason: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for search and filtering
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'stock.quantity': 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// Generate slug and SKU before saving
productSchema.pre('save', async function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
    
    // Ensure unique slug
    const existingProduct = await this.constructor.findOne({ 
      slug: this.slug, 
      _id: { $ne: this._id } 
    });
    
    if (existingProduct) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  
  // Auto-generate SKU if not provided
  if (!this.sku) {
    const prefix = this.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${prefix}-${timestamp}`;
  }
});

// Virtual for checking low stock
productSchema.virtual('isLowStock').get(function () {
  return this.stock.trackInventory && 
         this.stock.quantity <= this.stock.lowStockThreshold;
});

// Virtual for checking if in stock
productSchema.virtual('isInStock').get(function () {
  return !this.stock.trackInventory || this.stock.quantity > 0;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Static method for search
productSchema.statics.search = async function (query, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    sortOrder = -1,
    page = 1,
    limit = 20
  } = options;

  const filter = {
    status: 'active',
    $text: { $search: query }
  };

  if (category) filter.category = category;
  if (minPrice !== undefined) filter.price = { ...filter.price, $gte: minPrice };
  if (maxPrice !== undefined) filter.price = { ...filter.price, $lte: maxPrice };
  if (inStock) filter['stock.quantity'] = { $gt: 0 };

  const products = await this.find(filter)
    .populate('category', 'name slug')
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await this.countDocuments(filter);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
