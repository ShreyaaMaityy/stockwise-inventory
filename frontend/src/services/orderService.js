import apiClient from './api';

const orderService = {
  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  getOrder: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  deleteOrder: async (id) => {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data;
  },
};

export default orderService;
