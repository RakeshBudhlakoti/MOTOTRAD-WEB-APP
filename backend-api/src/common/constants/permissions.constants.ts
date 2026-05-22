export const PERMISSIONS = {
  // Settings Permissions
  READ_SETTING: 'READ_SETTING',
  UPDATE_SETTING: 'UPDATE_SETTING',

  // Seller Permissions
  APPROVE_SELLER: 'APPROVE_SELLER',

  // Catalog Permissions
  MANAGE_CATALOG: 'MANAGE_CATALOG',

  // CMS Permissions
  MANAGE_CMS: 'MANAGE_CMS',

  // Bid Permissions
  READ_BID: 'READ_BID',
  UPDATE_BID: 'UPDATE_BID',

  // Auction Permissions
  READ_AUCTION: 'READ_AUCTION',
  CREATE_AUCTION: 'CREATE_AUCTION',
  UPDATE_AUCTION: 'UPDATE_AUCTION',
  DELETE_AUCTION: 'DELETE_AUCTION',

  // Analytics & Logs Permissions
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
};

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
