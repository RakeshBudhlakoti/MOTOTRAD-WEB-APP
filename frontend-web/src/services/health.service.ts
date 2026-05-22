import apiClient from '@/lib/axios';

export const healthService = {
  checkBackendHealth: async () => {
    const { data } = await apiClient.get('/health');
    return data;
  }
};
