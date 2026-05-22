'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleSidebar, toggleMobileSidebar } from '../../store/slices/layoutSlice';
import { logout } from '../../store/slices/authSlice';
import { Menu, Bell, Search, ChevronDown, Clock, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../../services/admin.service';
import Link from 'next/link';

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const pathname = usePathname();
  const isCollapsed = useSelector((state: RootState) => state.layout.sidebarCollapsed);
  const isMobileOpen = useSelector((state: RootState) => state.layout.mobileSidebarOpen);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const previousUnreadCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Poll for unread notifications every 10 seconds
  const { data: notificationsData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => notificationsService.findAll({ isRead: false, limit: 5 }),
    refetchInterval: 10000,
    enabled: !!user,
  });

  const unreadCount = notificationsData?.meta?.total || 0;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
    }
  }, []);

  useEffect(() => {
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn('Audio playback failed or was blocked by browser:', err);
        });
      }
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);
  
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/login');
  };

  const getDisplayName = () => {
    if (!user) return 'Admin';
    const first = user.firstName || '';
    if (first.toLowerCase() === 'super' || user.username?.toLowerCase() === 'superadmin') {
      return 'Super Admin';
    }
    return first || user.username || 'Admin';
  };

  const getInitialsName = () => {
    if (!user) return 'Admin';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return getDisplayName();
  };

  return (
    <header 
      className={`fixed top-0 right-0 h-[var(--header-height)] bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 transition-all duration-300 ${isCollapsed ? 'lg:left-[70px]' : 'lg:left-[var(--sidebar-width)]'} left-0`}
    >
      <div className="flex items-center gap-4">
        {/* Desktop Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-sm text-slate-500 hover:bg-slate-50 transition-colors hidden lg:block"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Toggle */}
        <button
          onClick={() => dispatch(toggleMobileSidebar())}
          className="p-2 rounded-sm text-slate-500 hover:bg-slate-50 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-4 text-slate-400">
           <Link href="/" className="text-xs font-semibold hover:text-blue-600 transition-colors">Home</Link>
           <span className="text-slate-200">|</span>
           <Link href="/settings" className="text-xs font-semibold hover:text-blue-600 transition-colors">Settings</Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search */}
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 w-64 focus-within:border-blue-600 transition-all">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none px-2 text-xs font-medium w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className={`p-2.5 rounded-sm transition-all relative ${showNotifications ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-blue-600 text-[0.6rem] font-bold text-white flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-sm shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-[0.7rem] font-black uppercase tracking-widest text-slate-500">{unreadCount} Notifications</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificationsData?.items?.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">No unread alerts</div>
                ) : (
                  notificationsData?.items?.map((notif: any) => (
                    <Link key={notif.id} href={notif.actionUrl || "/notifications"} className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0" onClick={() => setShowNotifications(false)}>
                      <p className="text-[0.8rem] font-bold text-slate-800 leading-tight">{notif.title}</p>
                      <p className="text-[0.7rem] text-slate-500 truncate mt-1">{notif.message}</p>
                      <span className="text-[0.6rem] font-bold text-slate-300 mt-2 block uppercase">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                    </Link>
                  ))
                )}
              </div>
              <Link href="/notifications" className="block py-2.5 text-center text-[0.7rem] font-bold uppercase tracking-widest text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-200" onClick={() => setShowNotifications(false)}>
                See All Notifications
              </Link>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-2">
          <button 
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-sm border transition-all ${showUserMenu ? 'bg-slate-50 border-slate-300' : 'border-transparent hover:bg-slate-50'}`}
          >
            <div className="w-8 h-8 rounded-sm overflow-hidden bg-slate-200 border border-slate-300">
               {isMounted ? (
                  <img 
                     src={user?.avatar 
                       ? user.avatar 
                       : `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitialsName())}&background=007bff&color=fff&bold=true`
                     } 
                     alt="User" 
                     className="w-full h-full object-cover" 
                  />
               ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse" />
               )}
            </div>
            {isMounted ? (
               <span className="text-xs font-bold text-slate-700 hidden sm:block uppercase tracking-tighter">{getDisplayName()}</span>
            ) : (
               <div className="h-3 w-16 bg-slate-200 animate-pulse rounded-sm hidden sm:block" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-sm shadow-xl z-50 overflow-hidden">
               <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs font-bold text-slate-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{user?.email}</p>
               </div>
               <div className="py-1">
                  <Link href={user?.id ? `/users/${user.id}/edit` : '#'} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                    <User size={14} /> Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                    <SettingsIcon size={14} /> Settings
                  </Link>
               </div>
               <div className="border-t border-slate-100 py-1">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left font-bold uppercase tracking-wider"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
