export const ADMIN_CONSTANTS = {
  PORT: process.env.PORT || 3002,
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
  APP_NAME: 'Mototrad Admin',
  DEFAULT_LANGUAGE: 'en',
  PAGINATION: {
    DEFAULT_LIMIT: 10,
  },
  ROUTES: {
    DASHBOARD: '/',
    AUCTIONS: '/auctions',
    PRODUCTS: '/products',
    USERS: '/users',
    SELLERS: '/sellers',
    CMS: '/cms',
    SETTINGS: '/settings',
  },
  UPLOAD: {
    MAX_IMAGES: 10,
    MAX_FILE_SIZE_MB: 50,
    S3_FOLDERS: {
      AVATARS: 'avatars',
      PRODUCTS_THUMBNAILS: 'products/thumbnails',
      PRODUCTS_GALLERY: 'products/gallery',
      CATEGORIES: 'categories',
      BASKETS: 'baskets',
    }
  }
};
