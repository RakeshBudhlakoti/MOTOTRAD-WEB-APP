import apiClient from '@/lib/axios';

export const userService = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  getMyBids: async () => {
    const response = await apiClient.get('/users/my-bids');
    return response.data;
  },

  getMyOrders: async () => {
    const response = await apiClient.get('/users/my-orders');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
  },
};
