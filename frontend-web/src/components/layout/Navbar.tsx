'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { useSettings } from '@/context/SettingsContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { getSetting } = useSettings();
  
  const siteLogo = getSetting('site_logo', 'https://mototrad.com/assets/dist/img/mototrad-logo-cropped.jpg');
  const supportPhone = getSetting('support_phone', '');
  const supportEmail = getSetting('support_email', '');
  const siteAddress = getSetting('site_address', '');
  const socialFacebook = getSetting('social_facebook', '');
  const socialInstagram = getSetting('social_instagram', '');
  const socialTwitter = getSetting('social_twitter', '');
  const socialPinterest = getSetting('social_pinterest', '');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    dispatch(logout());
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Live Auctions', path: '/live-auctions' },
    { label: 'Past Auctions', path: '/past-auctions' },
    { label: 'How to Bid', path: '/how-to-bid' },
    { label: 'Philosophy', path: '/philosophy' },
    ...(!user?.isProMember ? [{ label: 'Membership', path: '/membership' }] : []),
    { label: 'Contact Us', path: '/contact-us' },
  ];

  return (
    <>
      {/* Top Black Bar Header - Clean, High Contrast Graphite */}
      {(siteAddress || supportPhone || supportEmail || socialFacebook || socialInstagram || socialTwitter || socialPinterest) && (
        <div className="bg-[#0F172A] text-white py-2 border-b border-white/5 hidden md:block select-none relative z-[1002]">
          <div className="container flex justify-between items-center text-[11px] font-bold text-slate-300">
            <div className="flex items-center gap-6">
              {siteAddress && (
                <span className="flex items-center gap-2 transition-colors hover:text-white">
                  <i className="fas fa-map-marker-alt text-primary"></i> {siteAddress}
                </span>
              )}
              {supportPhone && (
                <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-slate-300 hover:text-primary transition-all duration-300 hover:-translate-y-[0.5px]">
                  <i className="fas fa-phone-alt text-primary"></i> {supportPhone}
                </a>
              )}
              {supportEmail && (
                <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-slate-300 hover:text-primary transition-all duration-300 hover:-translate-y-[0.5px]">
                  <i className="far fa-envelope text-primary"></i> {supportEmail}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="w-5.5 h-5.5 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-300">
                  <i className="fab fa-facebook-f text-[10px]"></i>
                </a>
              )}
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="w-5.5 h-5.5 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-300">
                  <i className="fab fa-instagram text-[10px]"></i>
                </a>
              )}
              {socialTwitter && (
                <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="w-5.5 h-5.5 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-300">
                  <i className="fab fa-twitter text-[10px]"></i>
                </a>
              )}
              {socialPinterest && (
                <a href={socialPinterest} target="_blank" rel="noopener noreferrer" className="w-5.5 h-5.5 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-300">
                  <i className="fab fa-pinterest-p text-[10px]"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Navbar */}
      <nav className={`sticky top-0 z-[1000] py-3 lg:py-3.5 transition-all duration-500 border-b ${isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-[0_8px_30px_rgba(15,23,42,0.03)] border-slate-100/80' : 'bg-white border-slate-100'}`}>
        <div className="container flex justify-between items-center">
          
          {/* Brand Logo */}
          <Link href="/" className="flex flex-col no-underline hover:opacity-90 transition-opacity">
            <img 
              src={siteLogo} 
              alt="Mototrad Logo" 
              className="h-9 lg:h-10 w-auto object-contain"
            />
          </Link>

          {/* Center Navigation Links - Clean, Spacious, with Interactive Sliding Underline */}
          <ul className="hidden md:flex gap-[35px] list-none items-center m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.path} className="relative py-1 group">
                <Link 
                  href={link.path} 
                  className={`no-underline text-[0.92rem]  tracking-tight transition-colors duration-300 relative ${pathname === link.path ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
                >
                  {link.label}
                  {/* Sliding Underline indicator */}
                  <span className={`absolute bottom-[-6px] left-0 h-[2px] bg-gradient-to-r from-primary to-indigo-600 transition-all duration-300 rounded-full ${pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop User Account Actions / Icon (Far Right) */}
          <div className="hidden md:flex items-center" ref={dropdownRef}>
            {user ? (
              <div className="relative">
                <button 
                  className="flex items-center bg-transparent border-none cursor-pointer p-0.5 rounded-full hover:scale-105 transition-all duration-200 focus:outline-none"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="relative w-10 h-10">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#E2E8F0] bg-primary/5 shadow-inner">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=C90000&color=fff&bold=true`} 
                        alt="User" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    {user.isProMember && (
                      <span className="absolute bottom-0 right-0 w-[18px] h-[18px] bg-gradient-to-r from-amber-400 to-amber-600 border-2 border-white rounded-full flex items-center justify-center shadow-md select-none" title="Pro Member">
                        <i className="fas fa-crown text-[0.45rem] text-white"></i>
                      </span>
                    )}
                  </div>
                </button>

                {/* Spring-Animated User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                      className="absolute top-[125%] right-0 w-[240px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-[#E2E8F0]/70 p-3.5 z-[1001] flex flex-col gap-1"
                    >
                      <div className="px-3 py-2.5 border-b border-slate-50 mb-2">
                        <p className="font-extrabold text-[#0F172A] text-[0.95rem] m-0 truncate">{user.firstName} {user.lastName}</p>
                        <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block mt-1 ${user.isProMember ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 border border-slate-200/50'}`}>
                          {user.isProMember ? 'PRO MEMBER' : 'STANDARD MEMBER'}
                        </span>
                      </div>
                      <Link href="/profile?tab=dashboard" className="flex items-center gap-3 p-2.5 rounded-xl no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                        <i className="fas fa-chart-line w-5 opacity-70"></i> Dashboard
                      </Link>
                      <Link href="/profile?tab=details" className="flex items-center gap-3 p-2.5 rounded-xl no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                        <i className="fas fa-user w-5 opacity-70"></i> My Profile
                      </Link>
                      <Link href="/profile?tab=bids" className="flex items-center gap-3 p-2.5 rounded-xl no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                        <i className="fas fa-gavel w-5 opacity-70"></i> My Bids
                      </Link>
                      <Link href="/profile?tab=orders" className="flex items-center gap-3 p-2.5 rounded-xl no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                        <i className="fas fa-shopping-bag w-5 opacity-70"></i> My Orders
                      </Link>
                      {!user.isProMember && (
                        <Link href="/membership" className="flex items-center gap-3 p-2.5 rounded-xl no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                          <i className="fas fa-gem w-5 opacity-70"></i> Membership Pricing
                        </Link>
                      )}
                      <div className="h-px bg-slate-50 my-2"></div>
                      <button onClick={handleLogout} className="flex items-center gap-3 p-2.5 rounded-xl text-primary font-bold text-[0.88rem] hover:bg-[#FFF4F4] transition-all cursor-pointer border-none bg-transparent w-full text-left">
                        <i className="fas fa-sign-out-alt w-5 opacity-70"></i> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/login" className="bg-gradient-to-r from-[#0F172A] to-[#273246] text-white text-[11px] font-black uppercase tracking-wider py-2.5 px-6 rounded-xl hover:from-primary hover:to-primary shadow-[0_4px_15px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_25px_rgba(211,47,47,0.15)] transition-all duration-300 hover:scale-105 active:scale-95 no-underline">
                Access Terminal
              </Link>
            )}
          </div>

          {/* Mobile Navigation controls */}
          <div className="flex md:hidden items-center gap-4">
            {user ? (
              <div className="relative w-[34px] h-[34px]">
                <Link 
                  href="/profile?tab=dashboard" 
                  className="w-full h-full rounded-full overflow-hidden border border-[#E2E8F0] bg-primary/5 flex items-center justify-center shadow-sm block"
                >
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=C90000&color=fff&bold=true`} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                  />
                </Link>
                {user.isProMember && (
                  <span className="absolute bottom-0 right-0 w-[15px] h-[15px] bg-gradient-to-r from-amber-400 to-amber-600 border border-white rounded-full flex items-center justify-center shadow-sm select-none pointer-events-none">
                    <i className="fas fa-crown text-[0.4rem] text-white"></i>
                  </span>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="bg-gradient-to-r from-[#0F172A] to-[#273246] text-white text-[9px] uppercase tracking-wider py-2 px-3.5 rounded-lg shadow-sm hover:scale-105 transition-all no-underline font-extrabold">
                Access
              </Link>
            )}

            <button className="bg-transparent border-none text-[1.6rem] text-[#0F172A] cursor-pointer flex items-center justify-center p-1 focus:outline-none" onClick={() => setIsMenuOpen(true)}>
              <i className="fas fa-bars"></i>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Sidebar Navigation Drawer with AnimatePresence */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1999]"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Side Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[2000] p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-50">
                  <Link href="/" className="flex flex-col no-underline" onClick={() => setIsMenuOpen(false)}>
                    <img src={siteLogo} alt="Logo" className="h-[28px] w-auto object-contain" />
                  </Link>
                  <button onClick={() => setIsMenuOpen(false)} className="bg-slate-50 w-8 h-8 rounded-full border-none text-slate-500 cursor-pointer flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <i className="fas fa-times text-sm"></i>
                  </button>
                </div>
                
                <div className="flex flex-col gap-5">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.path} 
                      href={link.path} 
                      className={`text-[1.1rem] font-black no-underline transition-colors ${pathname === link.path ? 'text-primary' : 'text-slate-700 hover:text-primary'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 text-center">
                {user ? (
                  <button onClick={handleLogout} className="bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Logout Account
                  </button>
                ) : (
                  <Link href="/auth/login" className="bg-gradient-to-r from-primary to-indigo-600 text-white w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md inline-block no-underline text-center" onClick={() => setIsMenuOpen(false)}>
                    Access Terminal
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
