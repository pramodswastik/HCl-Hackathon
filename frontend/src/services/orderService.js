import api from './api';

const ORDERS_URL = '/orders';

const orderService = {
  // Consolidated order management API
  manageOrder: async (operation, data = {}) => {
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation,
      ...data
    });
    return response.data;
  },

  // Get user orders with pagination
  getOrders: async (params = {}) => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'list',
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status,
      paymentStatus: params.paymentStatus,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });
    
    const { data, pagination } = response.data;
    return {
      orders: data || [],
      pagination: pagination || { currentPage: 1, totalItems: 0, totalPages: 0 }
    };
  },

  // Get single order by ID
  getOrder: async (id) => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'get',
      orderId: id
    });
    return response.data.data || response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'create',
      ...orderData
    });
    return response.data.data || response.data;
  },

  // Update order status (Admin)
  updateOrderStatus: async (id, status, note = null, tracking = null) => {
    // Use consolidated API
    const payload = {
      operation: 'updateStatus',
      orderId: id,
      status
    };
    
    if (note) payload.note = note;
    if (tracking) payload.tracking = tracking;
    
    const response = await api.post(`${ORDERS_URL}/manage`, payload);
    return response.data;
  },

  // Reorder - create order from previous order
  reorder: async (orderId) => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'reorder',
      orderId
    });
    return response.data;
  },

  // Cancel order (using updateStatus with 'cancelled' status)
  cancelOrder: async (id) => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'updateStatus',
      orderId: id,
      status: 'cancelled'
    });
    return response.data;
  },

  // Get all orders (Admin)
  getAllOrders: async (params = {}) => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'getAllOrders',
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });
    
    const { data, pagination } = response.data;
    return {
      orders: data || [],
      pagination: pagination || { page: 1, total: 0, totalPages: 0 }
    };
  },

  // Get order statistics (Admin)
  getOrderStats: async (startDate = null, endDate = null) => {
    // Use consolidated API
    const payload = {
      operation: 'getStats'
    };
    
    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;
    
    const response = await api.post(`${ORDERS_URL}/manage`, payload);
    return response.data;
  },

  // Get order history
  getOrderHistory: async () => {
    // Use consolidated API
    const response = await api.post(`${ORDERS_URL}/manage`, {
      operation: 'getHistory'
    });
    return response.data;
  },
};

export default orderService;
