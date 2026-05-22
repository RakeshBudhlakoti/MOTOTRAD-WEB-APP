import apiClient from '@/lib/axios';

export const auctionService = {
  findAll: async (params?: any) => {
    const { data } = await apiClient.get('/auctions', { params });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/auctions/${id}`);
    return data;
  },

  getBids: async (auctionId: string) => {
    const { data } = await apiClient.get(`/auctions/${auctionId}/bids`);
    return data;
  },

  getMyBids: async () => {
    const { data } = await apiClient.get('/auctions/my-bids');
    return data;
  },
};
