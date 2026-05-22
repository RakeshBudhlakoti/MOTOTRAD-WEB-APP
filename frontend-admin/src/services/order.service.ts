import apiClient from '@/lib/axios';

export const orderService = {
  findAll: async () => {
    const { data } = await apiClient.get('/orders');
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data;
  },

  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
    return data;
  },
};
