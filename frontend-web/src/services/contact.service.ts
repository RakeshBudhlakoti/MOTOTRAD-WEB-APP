import apiClient from '@/lib/axios';

export const contactService = {
  submitInquiry: async (data: { name: string; email: string; phone?: string; subject: string; message: string }) => {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  },
};
