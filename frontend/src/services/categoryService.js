import api from './api';

const CATEGORIES_URL = '/categories';

const categoryService = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get(CATEGORIES_URL);
    return response.data.data || response.data;
  },

  // Get single category by ID
  getCategory: async (id) => {
    const response = await api.get(`${CATEGORIES_URL}/${id}`);
    return response.data.data || response.data;
  },

  // Create category (Admin)
  createCategory: async (categoryData) => {
    const response = await api.post(CATEGORIES_URL, categoryData, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    });
    return response.data.data || response.data;
  },

  // Update category (Admin)
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`${CATEGORIES_URL}/${id}`, categoryData, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    });
    return response.data.data || response.data;
  },

  // Delete category (Admin)
  deleteCategory: async (id) => {
    const response = await api.delete(`${CATEGORIES_URL}/${id}`);
    return response.data;
  },

  // Get category with products
  getCategoryWithProducts: async (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await api.get(`${CATEGORIES_URL}/${id}/products?${queryParams.toString()}`);
    return response.data.data || response.data;
  },

  // Get root categories (no parent)
  getRootCategories: async () => {
    const response = await api.get(`${CATEGORIES_URL}?root=true`);
    return response.data.data || response.data;
  },

  // Get subcategories of a category
  getSubcategories: async (parentId) => {
    const response = await api.get(`${CATEGORIES_URL}?parent=${parentId}`);
    return response.data.data || response.data;
  },
};

export default categoryService;
