'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from '../common/Breadcrumbs';
import { setMobileSidebarOpen } from '../../store/slices/layoutSlice';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const isCollapsed = useSelector((state: RootState) => state.layout.sidebarCollapsed);
  const isMobileOpen = useSelector((state: RootState) => state.layout.mobileSidebarOpen);

  // Close mobile sidebar on route change
  useEffect(() => {
    dispatch(setMobileSidebarOpen(false));
  }, [pathname, dispatch]);

  return (
    <div className="min-h-screen bg-[var(--bg-body)] overflow-x-hidden">
      <Sidebar />
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay lg:hidden" 
          onClick={() => dispatch(setMobileSidebarOpen(false))}
        />
      )}
      
      <div 
        className={`transition-all duration-300 pt-[var(--header-height)] min-h-screen flex flex-col admin-content-mobile ${
          isCollapsed ? 'lg:pl-[70px]' : 'lg:pl-[var(--sidebar-width)]'
        }`}
      >
        <Header />
        
        {/* Content Wrapper */}
        <main className="flex-grow p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 bg-white border-t border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center text-white text-[10px]">M</div>
            <span><span className="text-slate-800 font-black">MOTOTRAD</span> INFRASTRUCTURE v2.0.4</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support API</a>
            <span className="text-slate-300">|</span>
            <span>&copy; {new Date().getFullYear()} Mototrad Auctions</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
