export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATIONS: 'operations',
  SUPPORT: 'support',
  SELLER: 'seller',
  BUYER: 'buyer',
};

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
