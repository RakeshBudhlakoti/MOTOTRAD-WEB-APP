export const SOCKET_EVENTS = {
  JOIN_AUCTION: 'join_auction',
  LEAVE_AUCTION: 'leave_auction',
  PLACE_BID: 'place_bid',
  AUCTION_SOLD_OUT: 'auction_sold_out',
  AUCTION_ENDED: 'auction_ended',
  AUCTION_UPDATE: 'auction_update',
  AUCTION_SYNC: 'auction_sync',
  ONLINE_BIDDERS_COUNT: 'online_bidders_count',
  BID_PLACED: 'bid_placed',
  HIGHEST_BID_UPDATED: 'highest_bid_updated',
  BID_ERROR: 'bid_error',
};

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
