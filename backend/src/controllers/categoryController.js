/**
 * Category Controller
 * Handles all category-related operations
 */

const Category = require('../models/Category');
const { uploadToS3, deleteFromS3, generateS3Key } = require('../config/s3');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  ConflictError
} = require('../middleware/errorHandler');

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, isActive, displayOrder } = req.body;

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  });
  
  if (existingCategory) {
    throw new ConflictError('A category with this name already exists');
  }

  // Validate parent category if provided
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      throw new ValidationError('Parent category not found');
    }
  }

  // Handle logo upload to S3
  let logo = null;
  if (req.file) {
    const s3Key = generateS3Key(req.file.originalname, 'categories');
    const uploadResult = await uploadToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );
    logo = {
      url: uploadResult.url,
      publicId: uploadResult.key
    };
  }

  // Create category
  const category = await Category.create({
    name,
    description,
    parent: parent || null,
    isActive: isActive !== undefined ? isActive : true,
    displayOrder: displayOrder || 0,
    logo
  });

  // Populate parent for response
  await category.populate('parent', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    isActive,
    parent,
    search,
    sortBy,
    sortOrder,
    tree
  } = req.query;

  // If tree view is requested, return hierarchical structure
  if (tree === true || tree === 'true') {
    const categories = await Category.getCategoryTree();
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  }

  // Build query
  const query = {};

  // Filter by active status
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  // Filter by parent
  if (parent !== undefined) {
    query.parent = parent === 'null' || parent === null ? null : parent;
  }

  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy || 'displayOrder'] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [categories, total] = await Promise.all([
    Category.find(query)
      .populate('parent', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Category.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: categories.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: categories
  });
});

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id)
    .populate('parent', 'name slug')
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description logo isActive displayOrder',
      options: { sort: { displayOrder: 1 } }
    });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, parent, isActive, displayOrder } = req.body;

  // Find existing category
  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check for duplicate name (excluding current category)
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id }
    });
    
    if (existingCategory) {
      throw new ConflictError('A category with this name already exists');
    }
  }

  // Validate parent category if provided
  if (parent !== undefined && parent !== null) {
    // Prevent setting self as parent
    if (parent === id) {
      throw new ValidationError('A category cannot be its own parent');
    }

    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      throw new ValidationError('Parent category not found');
    }

    // Prevent circular reference
    if (parentCategory.ancestors.some(a => a._id.toString() === id)) {
      throw new ValidationError('Cannot set a descendant as parent (circular reference)');
    }
  }

  // Handle logo upload to S3
  if (req.file) {
    // Delete old logo if exists
    if (category.logo?.publicId) {
      try {
        await deleteFromS3(category.logo.publicId);
      } catch (error) {
        console.error('Failed to delete old logo:', error);
      }
    }

    const s3Key = generateS3Key(req.file.originalname, 'categories');
    const uploadResult = await uploadToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );
    category.logo = {
      url: uploadResult.url,
      publicId: uploadResult.key
    };
  }

  // Update fields
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (parent !== undefined) category.parent = parent;
  if (isActive !== undefined) category.isActive = isActive;
  if (displayOrder !== undefined) category.displayOrder = displayOrder;

  await category.save();

  // Populate for response
  await category.populate('parent', 'name slug');

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has subcategories
  const hasSubcategories = await Category.exists({ parent: id });
  if (hasSubcategories) {
    throw new ValidationError(
      'Cannot delete category with subcategories. Please delete or reassign subcategories first.'
    );
  }

  // Check if category has products (if Product model exists)
  try {
    const Product = require('../models/Product');
    const hasProducts = await Product.exists({ category: id });
    if (hasProducts) {
      throw new ValidationError(
        'Cannot delete category with associated products. Please reassign products first.'
      );
    }
  } catch (error) {
    // Product model might not exist yet, continue with deletion
    if (error.code !== 'MODULE_NOT_FOUND' && !(error instanceof ValidationError)) {
      console.error('Error checking products:', error);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
  }

  // Delete logo from S3 if exists
  if (category.logo?.publicId) {
    try {
      await deleteFromS3(category.logo.publicId);
    } catch (error) {
      console.error('Failed to delete logo from S3:', error);
    }
  }

  await Category.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: { id }
  });
});

/**
 * @desc    Delete category logo
 * @route   DELETE /api/categories/:id/logo
 * @access  Private/Admin
 */
const deleteCategoryLogo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (!category.logo?.publicId) {
    throw new ValidationError('Category does not have a logo');
  }

  // Delete from S3
  try {
    await deleteFromS3(category.logo.publicId);
  } catch (error) {
    console.error('Failed to delete logo from S3:', error);
  }

  // Remove logo from category
  category.logo = null;
  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category logo deleted successfully',
    data: category
  });
});

/**
 * @desc    Get category hierarchy (breadcrumb)
 * @route   GET /api/categories/:id/hierarchy
 * @access  Public
 */
const getCategoryHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id).select('name slug ancestors');
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const hierarchy = [
    ...category.ancestors,
    { _id: category._id, name: category.name, slug: category.slug }
  ];

  res.status(200).json({
    success: true,
    data: hierarchy
  });
});

/**
 * @desc    Update category product count
 * @route   PUT /api/categories/:id/product-count
 * @access  Private/Admin (internal use)
 */
const updateProductCount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Count products in this category
  try {
    const Product = require('../models/Product');
    const count = await Product.countDocuments({ category: id, isActive: true });
    category.metadata.productCount = count;
    await category.save();
  } catch (error) {
    console.error('Error updating product count:', error);
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  deleteCategoryLogo,
  getCategoryHierarchy,
  updateProductCount
};
