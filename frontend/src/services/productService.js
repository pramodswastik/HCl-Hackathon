import api from './api';

const UNIFIED_URL = '/products/unified';

/**
 * Product Operations
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

/**
 * Helper function to make unified API calls
 * @param {string} operation - The operation type
 * @param {object} data - The data for the operation
 * @param {FormData|null} formData - Optional FormData for file uploads
 * @returns {Promise} API response
 */
const callUnifiedAPI = async (operation, data = {}, formData = null) => {
  if (formData) {
    // For file uploads, append operation and data to FormData
    formData.append('operation', operation);
    formData.append('data', JSON.stringify(data));
    
    const response = await api.post(UNIFIED_URL, formData, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    });
    return response.data;
  } else {
    const response = await api.post(UNIFIED_URL, { operation, data });
    return response.data;
  }
};

const productService = {
  /**
   * Get all products with pagination and filters
   * @param {object} params - Filter parameters
   */
  getProducts: async (params = {}) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_ALL, {
      page: params.page,
      limit: params.limit,
      category: params.category,
      status: params.status,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock,
      isFeatured: params.isFeatured,
      isCombo: params.isCombo,
      search: params.search,
      sortBy: params.sort,
      sortOrder: params.order
    });
    
    const { data, page, pages, total, count } = response;
    return {
      products: data || [],
      pagination: { page, pages, total, count }
    };
  },

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   */
  getProduct: async (id) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_BY_ID, { id });
    return response.data || response;
  },

  /**
   * Get product by slug
   * @param {string} slug - Product slug
   */
  getProductBySlug: async (slug) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_BY_SLUG, { slug });
    return response.data || response;
  },

  /**
   * Search products with fuzzy search
   * @param {object} params - Search parameters
   */
  searchProducts: async (params = {}) => {
    const response = await callUnifiedAPI(OPERATIONS.SEARCH, {
      query: params.q,
      page: params.page,
      limit: params.limit,
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    });
    
    const { data, page, pages, total, count } = response;
    return {
      products: data || [],
      pagination: { page, pages, total, count }
    };
  },

  /**
   * Get featured products
   * @param {number} limit - Maximum number of products to return
   */
  getFeaturedProducts: async (limit = 8) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_FEATURED, { limit });
    return response.data || [];
  },

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {object} params - Additional parameters
   */
  getProductsByCategory: async (categoryId, params = {}) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_BY_CATEGORY, {
      categoryId,
      page: params.page,
      limit: params.limit,
      sortBy: params.sort,
      sortOrder: params.order
    });
    
    const { data, page, pages, total, count, category } = response;
    return {
      products: data || [],
      pagination: { page, pages, total, count },
      category
    };
  },

  /**
   * Get low stock products (Admin)
   * @param {object} params - Pagination parameters
   */
  getLowStockProducts: async (params = {}) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_LOW_STOCK, {
      page: params.page,
      limit: params.limit
    });
    
    const { data, page, pages, total, count } = response;
    return {
      products: data || [],
      pagination: { page, pages, total, count }
    };
  },

  /**
   * Create product (Admin)
   * @param {FormData|object} productData - Product data (can be FormData for images)
   */
  createProduct: async (productData) => {
    if (productData instanceof FormData) {
      // Extract data from FormData for the unified API
      const data = {};
      const formData = new FormData();
      
      for (const [key, value] of productData.entries()) {
        if (key === 'images') {
          formData.append('images', value);
        } else {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }
      
      formData.append('operation', OPERATIONS.CREATE);
      formData.append('data', JSON.stringify(data));
      
      const response = await api.post(UNIFIED_URL, formData, {
        transformRequest: [(data, headers) => {
          delete headers['Content-Type'];
          return data;
        }],
      });
      return response.data;
    } else {
      return await callUnifiedAPI(OPERATIONS.CREATE, productData);
    }
  },

  /**
   * Update product (Admin)
   * @param {string} id - Product ID
   * @param {FormData|object} productData - Product data to update
   */
  updateProduct: async (id, productData) => {
    if (productData instanceof FormData) {
      const data = { id };
      const formData = new FormData();
      
      for (const [key, value] of productData.entries()) {
        if (key === 'images') {
          formData.append('images', value);
        } else {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }
      
      formData.append('operation', OPERATIONS.UPDATE);
      formData.append('data', JSON.stringify(data));
      
      const response = await api.post(UNIFIED_URL, formData, {
        transformRequest: [(data, headers) => {
          delete headers['Content-Type'];
          return data;
        }],
      });
      return response.data;
    } else {
      return await callUnifiedAPI(OPERATIONS.UPDATE, { id, ...productData });
    }
  },

  /**
   * Delete product (Admin)
   * @param {string} id - Product ID
   */
  deleteProduct: async (id) => {
    return await callUnifiedAPI(OPERATIONS.DELETE, { id });
  },

  /**
   * Delete product image (Admin)
   * @param {string} productId - Product ID
   * @param {string} imageId - Image ID
   */
  deleteProductImage: async (productId, imageId) => {
    return await callUnifiedAPI(OPERATIONS.DELETE_IMAGE, { productId, imageId });
  },

  /**
   * Set primary product image (Admin)
   * @param {string} productId - Product ID
   * @param {string} imageId - Image ID
   */
  setPrimaryImage: async (productId, imageId) => {
    return await callUnifiedAPI(OPERATIONS.SET_PRIMARY_IMAGE, { productId, imageId });
  },

  /**
   * Update product stock (Admin)
   * @param {string} id - Product ID
   * @param {object} stockData - Stock update data { quantity, operation, reason }
   */
  updateStock: async (id, stockData) => {
    return await callUnifiedAPI(OPERATIONS.UPDATE_STOCK, {
      id,
      quantity: stockData.quantity,
      operation: stockData.operation,
      reason: stockData.reason
    });
  },

  /**
   * Get stock history for a product (Admin)
   * @param {string} id - Product ID
   */
  getStockHistory: async (id) => {
    const response = await callUnifiedAPI(OPERATIONS.GET_STOCK_HISTORY, { id });
    return response.data || response;
  },

  // Export operations for external use
  OPERATIONS
};

export default productService;
