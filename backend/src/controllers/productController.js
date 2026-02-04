/**
 * Product Controller
 * Handles all product-related operations
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToS3, deleteFromS3, generateS3Key } = require('../config/s3');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  ConflictError
} = require('../middleware/errorHandler');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    description,
    shortDescription,
    price,
    compareAtPrice,
    costPrice,
    category,
    stock,
    status,
    isCombo,
    comboItems,
    addOns,
    attributes,
    tags,
    weight,
    dimensions,
    seo,
    isFeatured
  } = req.body;

  // Validate category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new ValidationError('Category not found');
  }

  // Check for duplicate SKU if provided
  if (sku) {
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      throw new ConflictError('A product with this SKU already exists');
    }
  }

  // Validate combo items if it's a combo product
  if (isCombo && comboItems && comboItems.length > 0) {
    const productIds = comboItems.map(item => item.product);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    
    if (existingProducts.length !== productIds.length) {
      throw new ValidationError('One or more combo item products not found');
    }
  }

  // Handle image uploads to S3
  const images = [];
  console.log('[Product] Files received:', req.files?.length || 0, req.files?.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })));
  
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const s3Key = generateS3Key(file.originalname, 'products');
      const uploadResult = await uploadToS3(
        file.buffer,
        s3Key,
        file.mimetype
      );
      images.push({
        url: uploadResult.url,
        publicId: uploadResult.key,
        alt: name,
        isPrimary: i === 0 // First image is primary
      });
    }
  }

  // Create product
  const product = await Product.create({
    name,
    sku,
    description,
    shortDescription,
    price,
    compareAtPrice,
    costPrice,
    category,
    images,
    stock: stock || { quantity: 0, lowStockThreshold: 10, trackInventory: true },
    status: status || 'draft',
    isCombo: isCombo || false,
    comboItems: isCombo ? comboItems : [],
    addOns: addOns || [],
    attributes: attributes || [],
    tags: tags || [],
    weight,
    dimensions,
    seo,
    isFeatured: isFeatured || false,
    createdBy: req.user._id
  });

  // Populate category for response
  await product.populate('category', 'name slug');

  // Update category product count
  await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

/**
 * @desc    Get all products with pagination and filters
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    category,
    status,
    minPrice,
    maxPrice,
    inStock,
    isFeatured,
    isCombo,
    search,
    sortBy,
    sortOrder
  } = req.query;

  // Build query
  const query = {};

  // For public access, only show active products
  // Admin can see all statuses
  if (!req.user || req.user.role !== 'admin') {
    query.status = 'active';
  } else if (status) {
    query.status = status;
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
  }

  // Filter by stock availability
  if (inStock !== undefined) {
    if (inStock === true || inStock === 'true') {
      query['stock.quantity'] = { $gt: 0 };
    } else {
      query['stock.quantity'] = 0;
    }
  }

  // Filter by featured
  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === true || isFeatured === 'true';
  }

  // Filter by combo
  if (isCombo !== undefined) {
    query.isCombo = isCombo === true || isCombo === 'true';
  }

  // Simple search in name
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  const sort = {};
  const sortField = sortBy || 'createdAt';
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  // Calculate pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .select('-comboItems -attributes -seo -createdBy')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('category', 'name slug description')
    .populate({
      path: 'comboItems.product',
      select: 'name slug price images stock.quantity'
    })
    .populate('createdBy', 'firstName lastName');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if product is accessible (public can only see active products)
  if (!req.user || req.user.role !== 'admin') {
    if (product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

/**
 * @desc    Get product by slug
 * @route   GET /api/products/slug/:slug
 * @access  Public
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug })
    .populate('category', 'name slug description')
    .populate({
      path: 'comboItems.product',
      select: 'name slug price images stock.quantity'
    });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if product is accessible
  if (!req.user || req.user.role !== 'admin') {
    if (product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Find existing product
  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Validate category if being updated
  if (updateData.category && updateData.category !== product.category.toString()) {
    const categoryExists = await Category.findById(updateData.category);
    if (!categoryExists) {
      throw new ValidationError('Category not found');
    }

    // Update old and new category product counts
    await Promise.all([
      Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } }),
      Category.findByIdAndUpdate(updateData.category, { $inc: { productCount: 1 } })
    ]);
  }

  // Check for duplicate SKU if being updated
  if (updateData.sku && updateData.sku !== product.sku) {
    const existingProduct = await Product.findOne({
      sku: updateData.sku.toUpperCase(),
      _id: { $ne: id }
    });
    if (existingProduct) {
      throw new ConflictError('A product with this SKU already exists');
    }
  }

  // Validate combo items if updating
  if (updateData.isCombo && updateData.comboItems && updateData.comboItems.length > 0) {
    const productIds = updateData.comboItems.map(item => item.product);
    const existingProducts = await Product.find({ 
      _id: { $in: productIds, $ne: id } // Exclude self from combo
    });
    
    if (existingProducts.length !== productIds.length) {
      throw new ValidationError('One or more combo item products not found or invalid');
    }
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const newImages = [];
    for (const file of req.files) {
      const s3Key = generateS3Key(file.originalname, 'products');
      const uploadResult = await uploadToS3(
        file.buffer,
        s3Key,
        file.mimetype
      );
      newImages.push({
        url: uploadResult.url,
        publicId: uploadResult.key,
        alt: updateData.name || product.name,
        isPrimary: false
      });
    }
    // Append new images to existing ones
    product.images = [...product.images, ...newImages];
  }

  // Update fields
  Object.keys(updateData).forEach(key => {
    if (key !== 'images' && updateData[key] !== undefined) {
      product[key] = updateData[key];
    }
  });

  await product.save();

  // Populate for response
  await product.populate('category', 'name slug');

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if product is part of any combo
  const comboProducts = await Product.find({ 'comboItems.product': id });
  if (comboProducts.length > 0) {
    throw new ValidationError(
      `Cannot delete product. It is part of ${comboProducts.length} combo product(s). Remove from combos first.`
    );
  }

  // Delete product images from S3
  for (const image of product.images) {
    if (image.publicId) {
      try {
        await deleteFromS3(image.publicId);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  }

  // Update category product count
  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

  // Delete product
  await Product.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * @desc    Delete product image
 * @route   DELETE /api/products/:id/images/:imageId
 * @access  Private/Admin
 */
const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const imageIndex = product.images.findIndex(
    img => img._id.toString() === imageId
  );

  if (imageIndex === -1) {
    throw new NotFoundError('Image not found');
  }

  const image = product.images[imageIndex];

  // Delete from S3
  if (image.publicId) {
    try {
      await deleteFromS3(image.publicId);
    } catch (error) {
      console.error('Failed to delete image from S3:', error);
    }
  }

  // Remove from product
  product.images.splice(imageIndex, 1);

  // Set new primary if deleted was primary
  if (image.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    data: product.images
  });
});

/**
 * @desc    Set primary product image
 * @route   PUT /api/products/:id/images/:imageId/primary
 * @access  Private/Admin
 */
const setPrimaryImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const image = product.images.find(img => img._id.toString() === imageId);
  if (!image) {
    throw new NotFoundError('Image not found');
  }

  // Update all images
  product.images.forEach(img => {
    img.isPrimary = img._id.toString() === imageId;
  });

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Primary image updated successfully',
    data: product.images
  });
});

/**
 * @desc    Search products with fuzzy matching
 * @route   GET /api/products/search
 * @access  Public
 */
const searchProducts = asyncHandler(async (req, res) => {
  const {
    q: query,
    page,
    limit,
    category,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder
  } = req.query;

  if (!query || query.trim().length === 0) {
    throw new ValidationError('Search query is required');
  }

  // Build search filter
  const filter = {
    status: 'active',
    $or: [
      { $text: { $search: query } },
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { sku: { $regex: query, $options: 'i' } }
    ]
  };

  // Apply additional filters
  if (category) {
    filter.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }

  if (inStock === true || inStock === 'true') {
    filter['stock.quantity'] = { $gt: 0 };
  }

  // Build sort
  const sort = {};
  if (sortBy === 'relevance') {
    sort.score = { $meta: 'textScore' };
  } else {
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Execute search
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .select('name slug shortDescription price compareAtPrice images stock.quantity category')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    query,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
});

/**
 * @desc    Update product stock
 * @route   PUT /api/products/:id/stock
 * @access  Private/Admin
 */
const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, operation, reason } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const previousQuantity = product.stock.quantity;
  let newQuantity;

  switch (operation) {
    case 'add':
      newQuantity = previousQuantity + quantity;
      break;
    case 'subtract':
      newQuantity = previousQuantity - quantity;
      if (newQuantity < 0) {
        throw new ValidationError('Cannot subtract more than available stock');
      }
      break;
    case 'set':
    default:
      newQuantity = quantity;
      if (newQuantity < 0) {
        throw new ValidationError('Stock quantity cannot be negative');
      }
      break;
  }

  product.stock.quantity = newQuantity;

  // Log stock change (could be extended to a separate StockHistory model)
  const stockChange = {
    previousQuantity,
    newQuantity,
    change: newQuantity - previousQuantity,
    operation: operation || 'set',
    reason: reason || 'Manual adjustment',
    changedBy: req.user._id,
    changedAt: new Date()
  };

  // Store in product (optional - for simple tracking)
  if (!product.stockHistory) {
    product.stockHistory = [];
  }
  product.stockHistory.push(stockChange);

  // Keep only last 50 stock changes
  if (product.stockHistory.length > 50) {
    product.stockHistory = product.stockHistory.slice(-50);
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: {
      productId: product._id,
      name: product.name,
      previousQuantity,
      newQuantity,
      change: newQuantity - previousQuantity,
      isLowStock: newQuantity <= product.stock.lowStockThreshold
    }
  });
});

/**
 * @desc    Get stock history for a product
 * @route   GET /api/products/:id/stock/history
 * @access  Private/Admin
 */
const getStockHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .select('name sku stock stockHistory')
    .populate('stockHistory.changedBy', 'firstName lastName email');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.status(200).json({
    success: true,
    data: {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      history: product.stockHistory || []
    }
  });
});

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find({
      'stock.trackInventory': true,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    })
      .populate('category', 'name slug')
      .select('name sku stock category images')
      .sort({ 'stock.quantity': 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments({
      'stock.trackInventory': true,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    })
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const limitNum = parseInt(limit) || 10;

  const products = await Product.find({
    status: 'active',
    isFeatured: true
  })
    .populate('category', 'name slug')
    .select('name slug shortDescription price compareAtPrice images stock.quantity')
    .limit(limitNum)
    .lean();

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:categoryId
 * @access  Public
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  // Validate category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Get category and all its descendants
  const categoryIds = [categoryId];
  const subcategories = await Category.find({ parent: categoryId }).select('_id');
  categoryIds.push(...subcategories.map(c => c._id));

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const sort = {};
  sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find({
      category: { $in: categoryIds },
      status: 'active'
    })
      .populate('category', 'name slug')
      .select('name slug shortDescription price compareAtPrice images stock.quantity')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments({
      category: { $in: categoryIds },
      status: 'active'
    })
  ]);

  res.status(200).json({
    success: true,
    category: {
      id: category._id,
      name: category.name,
      slug: category.slug
    },
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  setPrimaryImage,
  searchProducts,
  updateStock,
  getStockHistory,
  getLowStockProducts,
  getFeaturedProducts,
  getProductsByCategory
};
