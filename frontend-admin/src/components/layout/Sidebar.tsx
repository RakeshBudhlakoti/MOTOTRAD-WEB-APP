'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Tags, 
  Package, 
  Gavel, 
  MessageSquare, 
  ShoppingCart, 
  Bell, 
  Settings, 
  FileText, 
  Image as ImageIcon,
  ChevronLeft,
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  BarChart3
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleSidebar, setMobileSidebarOpen } from '../../store/slices/layoutSlice';
import { logout } from '../../store/slices/authSlice';
import { ADMIN_CONSTANTS } from '@/constants/app.constants';

// Helper component for styled colorful sidebar icon containers
const ColoredIcon = ({ Icon, className, isActive }: { Icon: any, className: string, isActive: boolean }) => {
  return (
    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border transition-all duration-200 ${
      isActive 
        ? 'bg-white/20 text-white border-transparent' 
        : className
    }`}>
      <Icon size={15} className="transition-transform duration-200 group-hover:scale-110" />
    </div>
  );
};

const MENU_GROUPS = [
  {
    name: 'Dashboard',
    type: 'single',
    path: '/',
    icon: LayoutDashboard,
    colorClass: 'text-blue-600 bg-blue-50/80 border-blue-100/60 hover:bg-blue-100 hover:text-blue-700',
  },
  {
    name: 'Inventory',
    type: 'group',
    icon: Package,
    colorClass: 'text-emerald-600 bg-emerald-50/80 border-emerald-100/60 hover:bg-emerald-100 hover:text-emerald-700',
    children: [
      { name: 'Products', path: '/products' },
      { name: 'Categories', path: '/categories' },
      { name: 'Baskets', path: '/baskets' },
    ]
  },
  {
    name: 'Sales',
    type: 'group',
    icon: ShoppingCart,
    colorClass: 'text-orange-600 bg-orange-50/80 border-orange-100/60 hover:bg-orange-100 hover:text-orange-700',
    children: [
      { name: 'Bids', path: '/bids' },
      { name: 'Orders', path: '/orders' },
    ]
  },
  {
    name: 'Contacts',
    type: 'single',
    path: '/contacts',
    icon: MessageSquare,
    colorClass: 'text-purple-600 bg-purple-50/80 border-purple-100/60 hover:bg-purple-100 hover:text-purple-700',
  },
  {
    name: 'User Management',
    type: 'group',
    icon: Users,
    colorClass: 'text-cyan-600 bg-cyan-50/80 border-cyan-100/60 hover:bg-cyan-100 hover:text-cyan-700',
    children: [
      { name: 'Users', path: '/users' },
      { name: 'Roles & Permissions', path: '/roles' },
    ]
  },
  {
    name: 'Settings',
    type: 'single',
    path: '/settings',
    icon: Settings,
    colorClass: 'text-rose-600 bg-rose-50/80 border-rose-100/60 hover:bg-rose-100 hover:text-rose-700',
  },
  {
    name: 'Others',
    type: 'group',
    icon: Layers,
    colorClass: 'text-amber-600 bg-amber-50/80 border-amber-100/60 hover:bg-amber-100 hover:text-amber-700',
    children: [
      { name: 'Notifications', path: '/notifications' },
      { name: 'CMS Pages', path: '/cms' },
      { name: 'Banners', path: '/banners' },
      { name: 'Reports', path: '/reports' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const isCollapsed = useSelector((state: RootState) => state.layout.sidebarCollapsed);
  const isMobileOpen = useSelector((state: RootState) => state.layout.mobileSidebarOpen);

  // Manage single-open expandable sidebar group state
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${ADMIN_CONSTANTS.API_URL}/settings/public`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.site_logo) {
          setSiteLogo(data.site_logo);
        }
      } catch (error) {
        console.error('Error fetching dynamic logo:', error);
      }
    };
    fetchLogo();
  }, []);

  // Synchronize open group with the active page pathname on navigate
  useEffect(() => {
    for (const group of MENU_GROUPS) {
      if (group.type === 'group') {
        const isChildActive = group.children?.some(child => 
          pathname === child.path || (child.path !== '/' && pathname.startsWith(child.path))
        );
        if (isChildActive) {
          setOpenGroup(group.name);
          return;
        }
      }
    }
  }, [pathname]);

  const toggleGroup = (groupName: string) => {
    // Automatically expand the sidebar if collapsed when clicking group headers
    if (isCollapsed) {
      dispatch(toggleSidebar());
    }
    setOpenGroup(prev => prev === groupName ? null : groupName);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/login');
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-[var(--bg-sidebar)] border-r border-slate-200 z-50 transition-all duration-300 lg:translate-x-0 ${
        isCollapsed ? 'lg:w-[70px]' : 'lg:w-[var(--sidebar-width)]'
      } ${
        isMobileOpen ? 'admin-sidebar-mobile-open' : 'admin-sidebar-mobile-closed w-[var(--sidebar-width)]'
      }`}
    >
      {/* Brand Logo */}
      <div className="h-[var(--header-height)] flex items-center justify-between border-b border-slate-200 px-4 bg-slate-50/50">
        <div className="flex items-center">
          {siteLogo ? (
            <img 
              src={siteLogo} 
              alt="Mototrad Logo" 
              className="h-8 w-auto object-contain max-w-[120px]" 
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm shadow-blue-200">
              M
            </div>
          )}
          {(!isCollapsed || isMobileOpen) && !siteLogo && (
            <span className="ml-3 font-extrabold text-sm tracking-widest uppercase text-slate-800">
              Mototrad <span className="text-blue-600">Admin</span>
            </span>
          )}
          {(!isCollapsed || isMobileOpen) && siteLogo && (
            <span className="ml-3 font-extrabold text-xs tracking-widest uppercase text-slate-800">
              Admin
            </span>
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <div className="h-[calc(100vh-var(--header-height)-70px)] overflow-y-auto py-5 px-3 custom-scrollbar space-y-1.5">
        {MENU_GROUPS.map((item) => {
          if (item.type === 'single') {
            const itemPath = item.path || '';
            const isActive = pathname === itemPath || (itemPath !== '/' && pathname.startsWith(itemPath));
            return (
              <Link
                key={itemPath}
                href={itemPath}
                className={`flex items-center gap-3 px-2.5 py-1.5 rounded-md transition-all duration-200 border group ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-md shadow-blue-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                }`}
              >
                <ColoredIcon Icon={item.icon} className={item.colorClass} isActive={isActive} />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-[11.5px] font-extrabold uppercase tracking-wider">{item.name}</span>
                )}
              </Link>
            );
          } else {
            const isExpanded = openGroup === item.name;
            const isAnyChildActive = item.children?.some(child => 
              pathname === child.path || (child.path !== '/' && pathname.startsWith(child.path))
            ) || false;
            
            return (
              <div key={item.name} className="space-y-1">
                {/* Group Header Button */}
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md transition-all duration-200 border group ${
                    isAnyChildActive 
                      ? 'bg-slate-50 border-slate-200/60 text-slate-800 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ColoredIcon Icon={item.icon} className={item.colorClass} isActive={false} />
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="text-[11.5px] font-extrabold uppercase tracking-wider">{item.name}</span>
                    )}
                  </div>
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="text-slate-400 group-hover:text-slate-600">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  )}
                </button>

                {/* Group Children Accordion */}
                {isExpanded && (!isCollapsed || isMobileOpen) && (
                  <div className="pl-4 space-y-1 transition-all duration-200 border-l border-slate-100 ml-6">
                    {item.children?.map((child) => {
                      const isChildActive = pathname === child.path || (child.path !== '/' && pathname.startsWith(child.path));
                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`flex items-center gap-2 pl-4 pr-3 py-2 rounded-md text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 ${
                            isChildActive 
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildActive ? 'bg-white' : 'bg-slate-300'}`} />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* Footer / Logout */}
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-200 bg-slate-50/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-all duration-200 group border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-[10px] font-black uppercase tracking-widest">Logout System</span>
          )}
        </button>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      <button 
        onClick={() => dispatch(toggleSidebar())}
        className="absolute top-[70px] -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm z-50 hidden lg:flex transition-transform duration-200 hover:scale-110"
      >
        {isCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
      </button>
    </aside>
  );
}
