export const APP_CONSTANTS = {
  UPLOAD_FOLDERS: {
    PRODUCTS: 'products',
    SELLERS: 'sellers',
    KYC: 'kyc',
    BANNERS: 'banners',
    CMS: 'cms',
    PROFILES: 'profiles',
  },
};

export const DB_CONSTANTS = {
  BATCH_SIZE: 50,
};

export const REDIS_KEYS = {
  AUCTION_BID_LOCK: (id: string) => `auction_bid_lock:${id}`,
  AUCTION_STATE: (id: string) => `auction_state:${id}`,
};
