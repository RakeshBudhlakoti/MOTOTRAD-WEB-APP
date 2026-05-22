import apiClient from '@/lib/axios';

export const createAdminService = (resource: string) => ({
  findAll: async (params?: any) => {
    const { data } = await apiClient.get(`/${resource}`, { params });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/${resource}/${id}`);
    return data;
  },

  create: async (payload: any) => {
    const { data } = await apiClient.post(`/${resource}`, payload);
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/${resource}/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/${resource}/${id}`);
    return data;
  },

  // Generic methods for custom sub-routes
  get: async (path: string, params?: any) => {
    const { data } = await apiClient.get(`/${resource}/${path}`, { params });
    return data;
  },

  post: async (path: string, payload: any) => {
    const { data } = await apiClient.post(`/${resource}/${path}`, payload);
    return data;
  },

  patch: async (path: string, payload: any) => {
    const { data } = await apiClient.patch(`/${resource}/${path}`, payload);
    return data;
  },

  put: async (path: string, payload: any) => {
    const { data } = await apiClient.put(`/${resource}/${path}`, payload);
    return data;
  },

  delete: async (path: string) => {
    const { data } = await apiClient.delete(`/${resource}/${path}`);
    return data;
  },
});

export const usersService = createAdminService('users');
export const sellersService = createAdminService('sellers');
export const auctionsService = createAdminService('auctions');
export const productsService = createAdminService('products');
export const categoriesService = createAdminService('categories');
export const basketsService = createAdminService('baskets');
export const notificationsService = createAdminService('notifications');
export const ordersService = createAdminService('orders');
export const biddingService = createAdminService('bids');
export const paymentsService = createAdminService('payments');
export const shippingService = createAdminService('shipping');
export const settingsService = createAdminService('settings');
export const cmsService = createAdminService('cms/pages');
export const bannersService = createAdminService('banners');
export const contactsService = {
  ...createAdminService('contacts'),
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/contacts/${id}/status`, { status });
    return data;
  },
  reply: async (id: string, reply: string) => {
    const { data } = await apiClient.post(`/contacts/${id}/reply`, { reply });
    return data;
  },
};
export const analyticsService = {
  getStats: async () => {
    const { data } = await apiClient.get('/analytics/stats');
    return data;
  },
  getAuditLogs: async (params?: any) => {
    const { data } = await apiClient.get('/analytics/audit-logs', { params });
    return data;
  },
  getDashboardOverview: async () => {
    const { data } = await apiClient.get('/analytics/dashboard-overview');
    return data;
  },
};

export const rolesService = {
  ...createAdminService('roles'),
  getPermissions: async () => {
    const { data } = await apiClient.get('/roles/permissions');
    return data;
  }
};

export const uploadService = {
  getPresignedUrl: async (fileName: string, fileType: string, folder: string = 'general') => {
    const { data } = await apiClient.post('/upload/presigned-url', { 
      fileName, fileType, folder 
    });
    return data;
  },
  uploadToS3: async (uploadUrl: string, file: File) => {
    return fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }
};
