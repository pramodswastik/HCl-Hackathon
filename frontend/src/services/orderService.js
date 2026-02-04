import api from './api';

const ORDERS_URL = '/orders';

const orderService = {
  // Get user orders with pagination
  getOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const response = await api.get(`${ORDERS_URL}?${queryParams.toString()}`);
    return response.data;
  },

  // Get single order by ID
  getOrder: async (id) => {
    const response = await api.get(`${ORDERS_URL}/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post(ORDERS_URL, orderData);
    return response.data;
  },

  // Update order status (Admin)
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`${ORDERS_URL}/${id}/status`, { status });
    return response.data;
  },

  // Reorder - create order from previous order
  reorder: async (orderId) => {
    const response = await api.post(`${ORDERS_URL}/${orderId}/reorder`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await api.put(`${ORDERS_URL}/${id}/cancel`);
    return response.data;
  },

  // Get all orders (Admin)
  getAllOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await api.get(`${ORDERS_URL}/admin/all?${queryParams.toString()}`);
    return response.data;
  },

  // Get order statistics (Admin)
  getOrderStats: async () => {
    const response = await api.get(`${ORDERS_URL}/admin/stats`);
    return response.data;
  },
};

export default orderService;
