import api from './api';

const PRODUCTS_URL = '/products';

const productService = {
  // Get all products with pagination and filters
  getProducts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.inStock !== undefined) queryParams.append('inStock', params.inStock);
    
    const response = await api.get(`${PRODUCTS_URL}?${queryParams.toString()}`);
    const { data, page, pages, total, count } = response.data;
    return {
      products: data || [],
      pagination: { page, pages, total, count }
    };
  },

  // Get single product by ID
  getProduct: async (id) => {
    const response = await api.get(`${PRODUCTS_URL}/${id}`);
    return response.data.data || response.data;
  },

  // Search products with fuzzy search
  searchProducts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.q) queryParams.append('q', params.q);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    
    const response = await api.get(`${PRODUCTS_URL}/search?${queryParams.toString()}`);
    const { data, page, pages, total, count } = response.data;
    return {
      products: data || [],
      pagination: { page, pages, total, count }
    };
  },

  // Create product (Admin)
  createProduct: async (productData) => {
    const response = await api.post(PRODUCTS_URL, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update product (Admin)
  updateProduct: async (id, productData) => {
    const response = await api.put(`${PRODUCTS_URL}/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete product (Admin)
  deleteProduct: async (id) => {
    const response = await api.delete(`${PRODUCTS_URL}/${id}`);
    return response.data;
  },

  // Update product stock (Admin)
  updateStock: async (id, stockData) => {
    const response = await api.put(`${PRODUCTS_URL}/${id}/stock`, stockData);
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (categoryId, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('category', categoryId);
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    
    const response = await api.get(`${PRODUCTS_URL}?${queryParams.toString()}`);
    const { data, page, pages, total, count } = response.data;
    return {
      products: data || [],
      pagination: { page, pages, total, count }
    };
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get(`${PRODUCTS_URL}?featured=true&limit=${limit}`);
    return response.data.data || [];
  },
};

export default productService;
