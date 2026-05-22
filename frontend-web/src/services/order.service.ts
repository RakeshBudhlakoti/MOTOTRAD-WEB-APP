import apiClient from '@/lib/axios';

export const orderService = {
  createBuyNowOrder: async (auctionId: string, isPartial: boolean) => {
    const { data } = await apiClient.post('/orders/buy-now', { auctionId, isPartial });
    return data;
  },

  captureBuyNowPayment: async (paypalOrderId: string) => {
    const { data } = await apiClient.post('/orders/capture-buynow', { paypalOrderId });
    return data;
  },

  initiateBalancePayment: async (orderId: string) => {
    const { data } = await apiClient.post(`/orders/${orderId}/initiate-balance`);
    return data;
  },

  captureBalancePayment: async (orderId: string, paypalOrderId: string) => {
    const { data } = await apiClient.post(`/orders/${orderId}/capture-balance`, { paypalOrderId });
    return data;
  },

  findByAuctionId: async (auctionId: string) => {
    const { data } = await apiClient.get(`/orders/auction/${auctionId}`);
    return data;
  },

  initiateDepositPayment: async (orderId: string) => {
    const { data } = await apiClient.post(`/orders/${orderId}/initiate-deposit`);
    return data;
  },

  captureDepositPayment: async (orderId: string, paypalOrderId: string) => {
    const { data } = await apiClient.post(`/orders/${orderId}/capture-deposit`, { paypalOrderId });
    return data;
  },
};
