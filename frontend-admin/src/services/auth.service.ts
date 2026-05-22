import apiClient from '@/lib/axios';

export const authService = {
  login: async (credentials: any) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },
  
  getProfile: async () => {
    const { data } = await apiClient.get('/auth/profile');
    return data;
  },

  refresh: async () => {
    const { data } = await apiClient.post('/auth/refresh');
    return data;
  },
};
