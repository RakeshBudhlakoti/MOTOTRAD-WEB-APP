import apiClient from '@/lib/axios';

export const categoryService = {
  findAll: async (params?: { includePastCount?: boolean; includeActiveCount?: boolean }) => {
    const { data } = await apiClient.get('/categories', { params });
    return data;
  },
};

export const basketService = {
  findAll: async (params?: any) => {
    const { data } = await apiClient.get('/baskets', { params });
    return data;
  },
  findOne: async (slug: string) => {
    const { data } = await apiClient.get(`/baskets/${slug}`);
    return data;
  },
};

export const cmsService = {
  getPage: async (slug: string) => {
    const { data } = await apiClient.get(`/cms/pages/${slug}`);
    return data;
  },
  getBanners: async (position?: string) => {
    const { data } = await apiClient.get('/cms/banners', { params: { position } });
    return data;
  },
  getFaqs: async (category?: string) => {
    const { data } = await apiClient.get('/cms/faqs', { params: { category } });
    return data;
  },
};
