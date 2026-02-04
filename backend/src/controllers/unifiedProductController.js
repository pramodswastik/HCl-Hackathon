/**
 * Unified Product Controller
 * Consolidates all product-related operations into a single API endpoint
 * Uses 'operation' field to identify the type of operation
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToS3, deleteFromS3, generateS3Key } = require('../config/s3');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError
} = require('../middleware/errorHandler');

/**
 * Supported Operations:
 * - GET_ALL: Get all products with pagination and filters
 * - GET_BY_ID: Get single product by ID
 * - GET_BY_SLUG: Get product by slug
 * - SEARCH: Search products with fuzzy matching
 * - GET_FEATURED: Get featured products
 * - GET_BY_CATEGORY: Get products by category
 * - GET_LOW_STOCK: Get low stock products (Admin)
 * - CREATE: Create a new product (Admin)
 * - UPDATE: Update product (Admin)
 * - DELETE: Delete product (Admin)
 * - DELETE_IMAGE: Delete product image (Admin)
 * - SET_PRIMARY_IMAGE: Set primary product image (Admin)
 * - UPDATE_STOCK: Update product stock (Admin)
 * - GET_STOCK_HISTORY: Get stock history for a product (Admin)
 */

const OPERATIONS = {
  GET_ALL: 'GET_ALL',
  GET_BY_ID: 'GET_BY_ID',
  GET_BY_SLUG: 'GET_BY_SLUG',
  SEARCH: 'SEARCH',
  GET_FEATURED: 'GET_FEATURED',
  GET_BY_CATEGORY: 'GET_BY_CATEGORY',
  GET_LOW_STOCK: 'GET_LOW_STOCK',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  DELETE_IMAGE: 'DELETE_IMAGE',
  SET_PRIMARY_IMAGE: 'SET_PRIMARY_IMAGE',
  UPDATE_STOCK: 'UPDATE_STOCK',
  GET_STOCK_HISTORY: 'GET_STOCK_HISTORY'
};

// Admin-only operations
const ADMIN_OPERATIONS = [
  OPERATIONS.GET_LOW_STOCK,
  OPERATIONS.CREATE,
  OPERATIONS.UPDATE,
  OPERATIONS.DELETE,
  OPERATIONS.DELETE_IMAGE,
  OPERATIONS.SET_PRIMARY_IMAGE,
  OPERATIONS.UPDATE_STOCK,
  OPERATIONS.GET_STOCK_HISTORY
];

/**
 * @desc    Unified Product API Handler
 * @route   POST /api/products/unified
 * @access  Public/Private (depends on operation)
 */
const unifiedProductHandler = asyncHandler(async (req, res) => {
  // Handle both JSON body and multipart form data
  let operation, data;
  
  if (req.body.operation && typeof req.body.operation === 'string') {
    // Multipart form data - operation and data are strings
    operation = req.body.operation;
    try {
      data = req.body.data ? JSON.parse(req.body.data) : {};
    } catch (e) {
      data = req.body.data || {};
    }
  } else {
    // JSON body
    operation = req.body.operation;
    data = req.body.data || {};
  }

  if (!operation) {
    throw new ValidationError('Operation type is required');
  }

  if (!Object.values(OPERATIONS).includes(operation)) {
    throw new ValidationError(`Invalid operation: ${operation}. Valid operations are: ${Object.values(OPERATIONS).join(', ')}`);
  }

  // Check admin authorization for admin-only operations
  if (ADMIN_OPERATIONS.includes(operation)) {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required for this operation');
    }
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required for this operation');
    }
  }

  // Route to appropriate handler based on operation
  switch (operation) {
    case OPERATIONS.GET_ALL:
      return await handleGetAll(req, res, data);
    case OPERATIONS.GET_BY_ID:
      return await handleGetById(req, res, data);
    case OPERATIONS.GET_BY_SLUG:
      return await handleGetBySlug(req, res, data);
    case OPERATIONS.SEARCH:
      return await handleSearch(req, res, data);
    case OPERATIONS.GET_FEATURED:
      return await handleGetFeatured(req, res, data);
    case OPERATIONS.GET_BY_CATEGORY:
      return await handleGetByCategory(req, res, data);
    case OPERATIONS.GET_LOW_STOCK:
      return await handleGetLowStock(req, res, data);
    case OPERATIONS.CREATE:
      return await handleCreate(req, res, data);
    case OPERATIONS.UPDATE:
      return await handleUpdate(req, res, data);
    case OPERATIONS.DELETE:
      return await handleDelete(req, res, data);
    case OPERATIONS.DELETE_IMAGE:
      return await handleDeleteImage(req, res, data);
    case OPERATIONS.SET_PRIMARY_IMAGE:
      return await handleSetPrimaryImage(req, res, data);
    case OPERATIONS.UPDATE_STOCK:
      return await handleUpdateStock(req, res, data);
    case OPERATIONS.GET_STOCK_HISTORY:
      return await handleGetStockHistory(req, res, data);
    default:
      throw new ValidationError(`Unhandled operation: ${operation}`);
  }
});

/**
 * Handle GET_ALL operation
 */
const handleGetAll = async (req, res, data) => {
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
  } = data;

  const query = {};

  // For public access, only show active products
  if (!req.user || req.user.role !== 'admin') {
    query.status = 'active';
  } else if (status) {
    query.status = status;
  }

  if (category) query.category = category;

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
  }

  if (inStock !== undefined) {
    if (inStock === true || inStock === 'true') {
      query['stock.quantity'] = { $gt: 0 };
    } else {
      query['stock.quantity'] = 0;
    }
  }

  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === true || isFeatured === 'true';
  }

  if (isCombo !== undefined) {
    query.isCombo = isCombo === true || isCombo === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const sort = {};
  const sortField = sortBy || 'createdAt';
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

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
    operation: OPERATIONS.GET_ALL,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
};

/**
 * Handle GET_BY_ID operation
 */
const handleGetById = async (req, res, data) => {
  const { id } = data;

  if (!id) {
    throw new ValidationError('Product ID is required');
  }

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

  if (!req.user || req.user.role !== 'admin') {
    if (product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }
  }

  res.status(200).json({
    success: true,
    operation: OPERATIONS.GET_BY_ID,
    data: product
  });
};

/**
 * Handle GET_BY_SLUG operation
 */
const handleGetBySlug = async (req, res, data) => {
  const { slug } = data;

  if (!slug) {
    throw new ValidationError('Product slug is required');
  }

  const product = await Product.findOne({ slug })
    .populate('category', 'name slug description')
    .populate({
      path: 'comboItems.product',
      select: 'name slug price images stock.quantity'
    });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (!req.user || req.user.role !== 'admin') {
    if (product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }
  }

  res.status(200).json({
    success: true,
    operation: OPERATIONS.GET_BY_SLUG,
    data: product
  });
};

/**
 * Handle SEARCH operation
 */
const handleSearch = async (req, res, data) => {
  const {
    query: searchQuery,
    page,
    limit,
    category,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder
  } = data;

  if (!searchQuery || searchQuery.trim().length === 0) {
    throw new ValidationError('Search query is required');
  }

  const filter = {
    status: 'active',
    $or: [
      { $text: { $search: searchQuery } },
      { name: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } },
      { sku: { $regex: searchQuery, $options: 'i' } }
    ]
  };

  if (category) filter.category = category;

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }

  if (inStock === true || inStock === 'true') {
    filter['stock.quantity'] = { $gt: 0 };
  }

  const sort = {};
  if (sortBy === 'relevance') {
    sort.score = { $meta: 'textScore' };
  } else {
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

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
    operation: OPERATIONS.SEARCH,
    query: searchQuery,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
};

/**
 * Handle GET_FEATURED operation
 */
const handleGetFeatured = async (req, res, data) => {
  const { limit } = data;
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
    operation: OPERATIONS.GET_FEATURED,
    count: products.length,
    data: products
  });
};

/**
 * Handle GET_BY_CATEGORY operation
 */
const handleGetByCategory = async (req, res, data) => {
  const { categoryId, page, limit, sortBy, sortOrder } = data;

  if (!categoryId) {
    throw new ValidationError('Category ID is required');
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

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
    operation: OPERATIONS.GET_BY_CATEGORY,
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
};

/**
 * Handle GET_LOW_STOCK operation (Admin)
 */
const handleGetLowStock = async (req, res, data) => {
  const { page, limit } = data;

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
    operation: OPERATIONS.GET_LOW_STOCK,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products
  });
};

/**
 * Handle CREATE operation (Admin)
 */
const handleCreate = async (req, res, data) => {
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
  } = data;

  if (!name || !price || !category) {
    throw new ValidationError('Name, price, and category are required');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new ValidationError('Category not found');
  }

  if (sku) {
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      throw new ConflictError('A product with this SKU already exists');
    }
  }

  if (isCombo && comboItems && comboItems.length > 0) {
    const productIds = comboItems.map(item => item.product);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    if (existingProducts.length !== productIds.length) {
      throw new ValidationError('One or more combo item products not found');
    }
  }

  // Handle image uploads to S3
  const images = [];
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const s3Key = generateS3Key(file.originalname, 'products');
      const uploadResult = await uploadToS3(file.buffer, s3Key, file.mimetype);
      images.push({
        url: uploadResult.url,
        publicId: uploadResult.key,
        alt: name,
        isPrimary: i === 0
      });
    }
  }

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

  await product.populate('category', 'name slug');
  await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

  res.status(201).json({
    success: true,
    operation: OPERATIONS.CREATE,
    message: 'Product created successfully',
    data: product
  });
};

/**
 * Handle UPDATE operation (Admin)
 */
const handleUpdate = async (req, res, data) => {
  const { id, ...updateData } = data;

  if (!id) {
    throw new ValidationError('Product ID is required');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (updateData.category && updateData.category !== product.category.toString()) {
    const categoryExists = await Category.findById(updateData.category);
    if (!categoryExists) {
      throw new ValidationError('Category not found');
    }
    await Promise.all([
      Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } }),
      Category.findByIdAndUpdate(updateData.category, { $inc: { productCount: 1 } })
    ]);
  }

  if (updateData.sku && updateData.sku !== product.sku) {
    const existingProduct = await Product.findOne({
      sku: updateData.sku.toUpperCase(),
      _id: { $ne: id }
    });
    if (existingProduct) {
      throw new ConflictError('A product with this SKU already exists');
    }
  }

  if (updateData.isCombo && updateData.comboItems && updateData.comboItems.length > 0) {
    const productIds = updateData.comboItems.map(item => item.product);
    const existingProducts = await Product.find({
      _id: { $in: productIds, $ne: id }
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
      const uploadResult = await uploadToS3(file.buffer, s3Key, file.mimetype);
      newImages.push({
        url: uploadResult.url,
        publicId: uploadResult.key,
        alt: updateData.name || product.name,
        isPrimary: false
      });
    }
    product.images = [...product.images, ...newImages];
  }

  Object.keys(updateData).forEach(key => {
    if (key !== 'images' && key !== 'id' && updateData[key] !== undefined) {
      product[key] = updateData[key];
    }
  });

  await product.save();
  await product.populate('category', 'name slug');

  res.status(200).json({
    success: true,
    operation: OPERATIONS.UPDATE,
    message: 'Product updated successfully',
    data: product
  });
};

/**
 * Handle DELETE operation (Admin)
 */
const handleDelete = async (req, res, data) => {
  const { id } = data;

  if (!id) {
    throw new ValidationError('Product ID is required');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const comboProducts = await Product.find({ 'comboItems.product': id });
  if (comboProducts.length > 0) {
    throw new ValidationError(
      `Cannot delete product. It is part of ${comboProducts.length} combo product(s). Remove from combos first.`
    );
  }

  for (const image of product.images) {
    if (image.publicId) {
      try {
        await deleteFromS3(image.publicId);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  }

  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
  await Product.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    operation: OPERATIONS.DELETE,
    message: 'Product deleted successfully'
  });
};

/**
 * Handle DELETE_IMAGE operation (Admin)
 */
const handleDeleteImage = async (req, res, data) => {
  const { productId, imageId } = data;

  if (!productId || !imageId) {
    throw new ValidationError('Product ID and Image ID are required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
  if (imageIndex === -1) {
    throw new NotFoundError('Image not found');
  }

  const image = product.images[imageIndex];

  if (image.publicId) {
    try {
      await deleteFromS3(image.publicId);
    } catch (error) {
      console.error('Failed to delete image from S3:', error);
    }
  }

  product.images.splice(imageIndex, 1);

  if (image.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.status(200).json({
    success: true,
    operation: OPERATIONS.DELETE_IMAGE,
    message: 'Image deleted successfully',
    data: product.images
  });
};

/**
 * Handle SET_PRIMARY_IMAGE operation (Admin)
 */
const handleSetPrimaryImage = async (req, res, data) => {
  const { productId, imageId } = data;

  if (!productId || !imageId) {
    throw new ValidationError('Product ID and Image ID are required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const image = product.images.find(img => img._id.toString() === imageId);
  if (!image) {
    throw new NotFoundError('Image not found');
  }

  product.images.forEach(img => {
    img.isPrimary = img._id.toString() === imageId;
  });

  await product.save();

  res.status(200).json({
    success: true,
    operation: OPERATIONS.SET_PRIMARY_IMAGE,
    message: 'Primary image updated successfully',
    data: product.images
  });
};

/**
 * Handle UPDATE_STOCK operation (Admin)
 */
const handleUpdateStock = async (req, res, data) => {
  const { id, quantity, operation, reason } = data;

  if (!id) {
    throw new ValidationError('Product ID is required');
  }

  if (quantity === undefined) {
    throw new ValidationError('Quantity is required');
  }

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

  const stockChange = {
    previousQuantity,
    newQuantity,
    change: newQuantity - previousQuantity,
    operation: operation || 'set',
    reason: reason || 'Manual adjustment',
    changedBy: req.user._id,
    changedAt: new Date()
  };

  if (!product.stockHistory) {
    product.stockHistory = [];
  }
  product.stockHistory.push(stockChange);

  if (product.stockHistory.length > 50) {
    product.stockHistory = product.stockHistory.slice(-50);
  }

  await product.save();

  res.status(200).json({
    success: true,
    operation: OPERATIONS.UPDATE_STOCK,
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
};

/**
 * Handle GET_STOCK_HISTORY operation (Admin)
 */
const handleGetStockHistory = async (req, res, data) => {
  const { id } = data;

  if (!id) {
    throw new ValidationError('Product ID is required');
  }

  const product = await Product.findById(id)
    .select('name sku stock stockHistory')
    .populate('stockHistory.changedBy', 'firstName lastName email');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.status(200).json({
    success: true,
    operation: OPERATIONS.GET_STOCK_HISTORY,
    data: {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      history: product.stockHistory || []
    }
  });
};

module.exports = {
  unifiedProductHandler,
  OPERATIONS
};
