import apiClient from '@/lib/axios';

export const settingsService = {
  getPublic: async () => {
    const { data } = await apiClient.get('/settings/public');
    return data;
  },
};
