import apiClient from '@/lib/axios';

export const commissionService = {
  calculate: async (productId: string, amount: number) => {
    const { data } = await apiClient.get('/commissions/calculate', {
      params: { productId, amount },
    });
    return data;
  },
};
