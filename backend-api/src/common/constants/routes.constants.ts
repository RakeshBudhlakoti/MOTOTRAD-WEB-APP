export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
  },
  AUCTIONS: {
    BASE: '/auctions',
    BY_ID: (id: string) => `/auctions/${id}`,
    BIDS: (id: string) => `/auctions/${id}/bids`,
  },
  SETTINGS: {
    PUBLIC: '/settings/public',
    ALL: '/settings/all',
    BULK: '/settings/bulk',
  },
};
