export const WEB_CONSTANTS = {
  PORT: process.env.PORT || 3001,
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001',
  APP_NAME: 'Mototrad Marketplace',
  CONTACT_EMAIL: 'support@mototrad.com',
  SOCIAL_LINKS: {
    TWITTER: 'https://twitter.com/mototrad',
    INSTAGRAM: 'https://instagram.com/mototrad',
  },
  ROUTES: {
    HOME: '/',
    AUCTIONS: '/auctions',
    LIVE: '/auctions/live',
    SELL: '/sell',
    DASHBOARD: '/dashboard',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  AUCTION: {
    UPDATE_INTERVAL_MS: 1000,
    CURRENCY: 'USD',
  }
};
