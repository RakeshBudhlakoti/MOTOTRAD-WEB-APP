import {
  LayoutDashboard,
  Users,
  Shield,
  LayoutGrid,
  Tags,
  Package,
  Gavel,
  ShoppingCart,
  Bell,
  Settings,
} from 'lucide-react';

export const MENU_GROUPS = [
  {
    group: 'DASHBOARD',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'Notifications', icon: Bell, path: '/notifications' },
    ]
  },
  {
    group: 'COMMERCE',
    items: [
      { label: 'Products', icon: Package, path: '/products' },
      { label: 'Bids', icon: Gavel, path: '/bids' },
      { label: 'Orders', icon: ShoppingCart, path: '/orders' },
    ]
  },
  {
    group: 'CATALOG',
    items: [
      { label: 'Categories', icon: LayoutGrid, path: '/categories' },
      { label: 'Buckets', icon: Tags, path: '/baskets' },
    ]
  },
  {
    group: 'ACCESS',
    items: [
      { label: 'Users', icon: Users, path: '/users' },
      { label: 'Roles (RBAC)', icon: Shield, path: '/roles' },
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings, path: '/settings' },
    ]
  }
];


export const MENU_ITEMS = MENU_GROUPS.flatMap(g => g.items);
