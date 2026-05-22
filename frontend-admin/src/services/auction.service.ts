import apiClient from '@/lib/axios';

export const auctionService = {
  getAuctions: async (params: any) => {
    const { data } = await apiClient.get('/auctions', { params });
    return data;
  },

  getAuction: async (id: string) => {
    const { data } = await apiClient.get(`/auctions/${id}`);
    return data;
  },

  createAuction: async (payload: any) => {
    const { data } = await apiClient.post('/auctions', payload);
    return data;
  },

  updateAuction: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/auctions/${id}`, payload);
    return data;
  },

  pauseAuction: async (id: string) => {
    const { data } = await apiClient.post(`/auctions/${id}/pause`);
    return data;
  },

  endAuctionEarly: async (id: string) => {
    const { data } = await apiClient.post(`/auctions/${id}/end-early`);
    return data;
  },

  relistAuction: async (id: string, endTime: string) => {
    const { data } = await apiClient.post(`/auctions/${id}/relist`, { endTime });
    return data;
  },

  deleteAuction: async (id: string) => {
    const { data } = await apiClient.delete(`/auctions/${id}`);
    return data;
  },

  removeBid: async ({ auctionId, bidId }: { auctionId: string, bidId: string }) => {
    const { data } = await apiClient.delete(`/auctions/${auctionId}/bids/${bidId}`);
    return data;
  },
};
