/**
 * Order Controller
 * Handles all order-related operations
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../middleware/errorHandler');

// Tax rate (configurable, can be moved to config)
const DEFAULT_TAX_RATE = 0.08; // 8% tax

/**
 * Calculate order totals including add-ons and tax
 * @param {Array} items - Array of order items with product details
 * @param {Number} taxRate - Tax rate to apply
 * @param {Number} shippingCost - Shipping cost
 * @param {Object} coupon - Coupon details (optional)
 */
const calculateOrderTotals = (items, taxRate = DEFAULT_TAX_RATE, shippingCost = 0, coupon = null) => {
  // Calculate subtotal for each item (price + add-ons) * quantity
  let subtotal = 0;
  
  const processedItems = items.map(item => {
    const addOnsTotal = (item.addOns || []).reduce((sum, addOn) => sum + (addOn.price || 0), 0);
    const itemSubtotal = (item.price + addOnsTotal) * item.quantity;
    subtotal += itemSubtotal;
    
    return {
      ...item,
      subtotal: itemSubtotal
    };
  });

  // Calculate discount
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.discount) / 100;
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.discount, subtotal); // Discount can't exceed subtotal
    }
  }

  // Calculate tax on discounted subtotal
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * taxRate;

  // Calculate total
  const total = taxableAmount + tax + shippingCost;

  return {
    items: processedItems,
    pricing: {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      taxRate: taxRate,
      shipping: shippingCost,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  };
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    shippingCost,
    coupon,
    notes
  } = req.body;

  // Validate and fetch product details
  const orderItems = [];
  
  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      throw new ValidationError(`Product with ID ${item.product} not found`);
    }
    
    if (product.status !== 'active') {
      throw new ValidationError(`Product "${product.name}" is not available for purchase`);
    }
    
    // Check stock availability
    if (product.stock.trackInventory && product.stock.quantity < item.quantity) {
      throw new ValidationError(
        `Insufficient stock for "${product.name}". Available: ${product.stock.quantity}`
      );
    }

    // Validate add-ons if provided
    const validAddOns = [];
    if (item.addOns && item.addOns.length > 0) {
      for (const addOn of item.addOns) {
        const productAddOn = product.addOns?.find(a => a.name === addOn.name);
        if (productAddOn && productAddOn.isAvailable !== false) {
          validAddOns.push({
            name: productAddOn.name,
            price: productAddOn.price
          });
        }
      }
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: item.quantity,
      addOns: validAddOns
    });
  }

  // Calculate order totals
  const { items: processedItems, pricing } = calculateOrderTotals(
    orderItems,
    DEFAULT_TAX_RATE,
    shippingCost || 0,
    coupon
  );

  // Create the order
  const order = await Order.create({
    user: req.user._id,
    items: processedItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    pricing,
    coupon: coupon ? {
      code: coupon.code,
      discount: pricing.discount,
      type: coupon.type
    } : undefined,
    paymentMethod,
    notes: notes ? { customer: notes } : undefined,
    statusHistory: [{
      status: 'pending',
      timestamp: new Date(),
      updatedBy: req.user._id
    }]
  });

  // Update product stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 'stock.quantity': -item.quantity }
    });
  }

  // Populate order data for response
  await order.populate([
    { path: 'user', select: 'firstName lastName email' },
    { path: 'items.product', select: 'name slug images' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

/**
 * @desc    Get all orders for the authenticated user (paginated)
 * @route   GET /api/orders
 * @access  Private
 */
const getOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { user: req.user._id };

  // Admin can see all orders
  if (req.user.role === 'admin' && req.query.all === 'true') {
    delete query.user;
    
    // Admin can filter by user
    if (req.query.userId) {
      query.user = req.query.userId;
    }
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by payment status
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  // Calculate pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name slug images')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    }
  });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name slug images price')
    .populate('statusHistory.updatedBy', 'firstName lastName');

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('Access denied. You can only view your own orders.');
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update order status (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, tracking } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: ['refunded'],
    refunded: []
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new ValidationError(
      `Invalid status transition. Cannot change from "${order.status}" to "${status}"`
    );
  }

  // Update status
  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy: req.user._id
  });

  // Handle specific status updates
  if (status === 'shipped' && tracking) {
    order.tracking = {
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      estimatedDelivery: tracking.estimatedDelivery,
      shippedAt: new Date()
    };
  }

  if (status === 'delivered') {
    order.tracking.deliveredAt = new Date();
  }

  if (status === 'cancelled' || status === 'refunded') {
    // Restore stock for cancelled/refunded orders
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'stock.quantity': item.quantity }
      });
    }

    if (status === 'refunded') {
      order.paymentStatus = 'refunded';
    }
  }

  await order.save();

  // Populate for response
  await order.populate([
    { path: 'user', select: 'firstName lastName email' },
    { path: 'statusHistory.updatedBy', select: 'firstName lastName' }
  ]);

  res.json({
    success: true,
    message: `Order status updated to "${status}"`,
    data: order
  });
});

/**
 * @desc    Quick re-order - Create a new order from a previous order
 * @route   POST /api/orders/:id/reorder
 * @access  Private
 */
const reorder = asyncHandler(async (req, res) => {
  const originalOrder = await Order.findById(req.params.id);

  if (!originalOrder) {
    throw new NotFoundError('Original order not found');
  }

  // Check if user owns the order
  if (originalOrder.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Access denied. You can only reorder your own orders.');
  }

  // Prepare items for new order
  const reorderItems = [];
  const unavailableItems = [];

  for (const item of originalOrder.items) {
    const product = await Product.findById(item.product);

    if (!product || product.status !== 'active') {
      unavailableItems.push({
        name: item.name,
        reason: 'Product no longer available'
      });
      continue;
    }

    if (product.stock.trackInventory && product.stock.quantity < item.quantity) {
      if (product.stock.quantity > 0) {
        // Partial availability
        reorderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price, // Use current price
          quantity: product.stock.quantity,
          addOns: item.addOns
        });
        unavailableItems.push({
          name: item.name,
          reason: `Only ${product.stock.quantity} available (requested ${item.quantity})`
        });
      } else {
        unavailableItems.push({
          name: item.name,
          reason: 'Out of stock'
        });
      }
      continue;
    }

    reorderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      price: product.price, // Use current price
      quantity: item.quantity,
      addOns: item.addOns
    });
  }

  if (reorderItems.length === 0) {
    throw new ValidationError('None of the items from the original order are available');
  }

  // Calculate new order totals
  const { items: processedItems, pricing } = calculateOrderTotals(
    reorderItems,
    DEFAULT_TAX_RATE,
    originalOrder.pricing.shipping
  );

  // Create the new order
  const newOrder = await Order.create({
    user: req.user._id,
    items: processedItems,
    shippingAddress: originalOrder.shippingAddress,
    billingAddress: originalOrder.billingAddress,
    pricing,
    paymentMethod: originalOrder.paymentMethod,
    notes: {
      customer: `Reorder from order #${originalOrder.orderNumber}`
    },
    statusHistory: [{
      status: 'pending',
      timestamp: new Date(),
      note: `Reordered from order #${originalOrder.orderNumber}`,
      updatedBy: req.user._id
    }]
  });

  // Update product stock
  for (const item of reorderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 'stock.quantity': -item.quantity }
    });
  }

  // Populate order data for response
  await newOrder.populate([
    { path: 'user', select: 'firstName lastName email' },
    { path: 'items.product', select: 'name slug images' }
  ]);

  res.status(201).json({
    success: true,
    message: unavailableItems.length > 0 
      ? 'Order created with some items modified or unavailable' 
      : 'Order created successfully',
    data: newOrder,
    unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined,
    originalOrderNumber: originalOrder.orderNumber
  });
});

/**
 * @desc    Get order statistics (Admin only)
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
const getOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await Order.getStatistics(startDate, endDate);

  res.json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get user's order history summary
 * @route   GET /api/orders/history
 * @access  Private
 */
const getOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get order summary for user
  const [orderStats, recentOrders, frequentProducts] = await Promise.all([
    // Total orders and spending
    Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]),
    // Recent 5 orders
    Order.find({ user: userId })
      .select('orderNumber status pricing.total createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    // Most frequently ordered products
    Order.aggregate([
      { $match: { user: userId } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    success: true,
    data: {
      summary: orderStats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
      },
      recentOrders,
      frequentProducts
    }
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  reorder,
  getOrderStats,
  getOrderHistory
};
