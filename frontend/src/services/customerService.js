import apiClient from './api';

const customerService = {
  getCustomers: async () => {
    const response = await apiClient.get('/customers');
    return response.data;
  },

  getCustomer: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (customerData) => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
};

export default customerService;
