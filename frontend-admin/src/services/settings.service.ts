import apiClient from '@/lib/axios';

export const settingsService = {
  getAll: async () => {
    const { data } = await apiClient.get('/settings');
    return data;
  },
  
  update: async (key: string, value: string) => {
    const { data } = await apiClient.patch(`/settings/${key}`, { value });
    return data;
  },

  bulkUpdate: async (settings: Record<string, string>) => {
    const { data } = await apiClient.patch('/settings', settings);
    return data;
  }
};
