const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    logo: {
      url: String,
      publicId: String // For cloud storage reference
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        },
        name: String,
        slug: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    metadata: {
      productCount: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });

// Generate slug before saving
categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function () {
  const categories = await this.find({ parent: null, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { displayOrder: 1 } }
    })
    .sort({ displayOrder: 1 });
  
  return categories;
};

// Build ancestors array when parent changes
categorySchema.pre('save', async function () {
  if (this.isModified('parent') && this.parent) {
    const parent = await this.constructor.findById(this.parent);
    if (parent) {
      this.ancestors = [
        ...parent.ancestors,
        { _id: parent._id, name: parent.name, slug: parent.slug }
      ];
    }
  } else if (!this.parent) {
    this.ancestors = [];
  }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
