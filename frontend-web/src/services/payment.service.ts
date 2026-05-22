import apiClient from '../lib/axios';

export const paymentService = {
  createOrder: async (auctionId: string) => {
    const { data } = await apiClient.post(`/payments/create-order/${auctionId}`);
    return data;
  },

  initiatePayment: async (orderId: string, type: 'DEPOSIT' | 'FULL') => {
    const { data } = await apiClient.post(`/payments/initiate/${orderId}`, { type });
    return data;
  },

  getHistory: async () => {
    const { data } = await apiClient.get('/payments/history');
    return data;
  },
};
