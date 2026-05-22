'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
      {/* Top Black Bar Header */}
      {(siteAddress || supportPhone || supportEmail || socialFacebook || socialInstagram || socialTwitter || socialPinterest) && (
        <div className="bg-[#111111] text-white py-2.5 border-b border-white/5 hidden md:block select-none">
          <div className="container flex justify-between items-center text-xs font-semibold text-white/90">
            <div className="flex items-center gap-6">
              {siteAddress && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-primary"></i> {siteAddress}
                </span>
              )}
              {supportPhone && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-phone-alt text-primary"></i> {supportPhone}
                </span>
              )}
              {supportEmail && (
                <span className="flex items-center gap-2">
                  <i className="far fa-envelope text-primary"></i> {supportEmail}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-white/70">
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
              )}
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
              )}
              {socialTwitter && (
                <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
              )}
              {socialPinterest && (
                <a href={socialPinterest} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <i className="fab fa-pinterest-p"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header / Sticky Navbar */}
      <nav className={`sticky top-0 z-[1000] py-4 transition-all duration-300 border-b ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-border-base' : 'bg-white border-border-base'}`}>
        <div className="container flex justify-between items-center">
          
          {/* Brand Logo */}
          <Link href="/" className="flex flex-col no-underline">
            <img 
              src={siteLogo} 
              alt="Mototrad Logo" 
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Center Navigation Links (Clean & Spacious) */}
          <ul className="hidden md:flex gap-[35px] list-none items-center m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  href={link.path} 
                  className={`font-bold no-underline text-[0.95rem] tracking-tight transition-colors duration-200 ${pathname === link.path ? 'text-primary' : 'text-text-dark hover:text-primary'}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop User Account Actions / Icon (Far Right) */}
          <div className="hidden md:flex items-center" ref={dropdownRef}>
            {user ? (
              <div className="relative">
                <button 
                  className="flex items-center bg-transparent border-none cursor-pointer p-0.5 rounded-full hover:scale-105 transition-all duration-200"
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

                {isUserMenuOpen && (
                  <div className="absolute top-[120%] right-0 w-[240px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-border-base p-3 z-[1001] flex flex-col gap-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border-base mb-2">
                      <p className="font-black text-[#111] text-[0.95rem] m-0 truncate">{user.firstName} {user.lastName}</p>
                      <span className={`text-[0.6rem] font-black uppercase px-2.5 py-0.5 rounded-full inline-block mt-1 ${user.isProMember ? 'bg-primary text-white' : 'bg-[#EEE] text-[#888]'}`}>
                        {user.isProMember ? 'PRO MEMBER' : 'STANDARD MEMBER'}
                      </span>
                    </div>
                    <Link href="/profile?tab=dashboard" className="flex items-center gap-3 p-2.5 rounded-lg no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                      <i className="fas fa-chart-line w-5 opacity-70"></i> Dashboard
                    </Link>
                    <Link href="/profile?tab=details" className="flex items-center gap-3 p-2.5 rounded-lg no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                      <i className="fas fa-user w-5 opacity-70"></i> My Profile
                    </Link>
                    <Link href="/profile?tab=bids" className="flex items-center gap-3 p-2.5 rounded-lg no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                      <i className="fas fa-gavel w-5 opacity-70"></i> My Bids
                    </Link>
                    <Link href="/profile?tab=orders" className="flex items-center gap-3 p-2.5 rounded-lg no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                      <i className="fas fa-shopping-bag w-5 opacity-70"></i> My Orders
                    </Link>
                    {!user.isProMember && (
                      <Link href="/membership" className="flex items-center gap-3 p-2.5 rounded-lg no-underline text-[#555] font-bold text-[0.88rem] hover:bg-[#FFF4F4] hover:text-primary transition-all" onClick={() => setIsUserMenuOpen(false)}>
                        <i className="fas fa-gem w-5 opacity-70"></i> Membership Pricing
                      </Link>
                    )}
                    <div className="h-px bg-border-base my-2"></div>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-2.5 rounded-lg text-primary font-bold text-[0.88rem] hover:bg-[#FFF4F4] transition-all cursor-pointer border-none bg-transparent w-full text-left">
                      <i className="fas fa-sign-out-alt w-5 opacity-70"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn btn-primary text-xs uppercase tracking-wider py-2.5 px-6 font-bold shadow-md hover:scale-105 transition-all">
                Login / Sign Up
              </Link>
            )}
          </div>

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
              <Link href="/auth/login" className="btn btn-primary text-[0.7rem] uppercase tracking-wider py-1.5 px-3.5 font-bold shadow-sm hover:scale-105 transition-all">
                Login / Sign Up
              </Link>
            )}

            <button className="bg-transparent border-none text-[1.6rem] text-text-dark cursor-pointer flex items-center justify-center p-1" onClick={() => setIsMenuOpen(true)}>
              <i className="fas fa-bars"></i>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Sidebar Navigation Drawer */}
      <div className={`fixed inset-0 bg-white z-[2000] p-10 flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <Link href="/" className="flex flex-col no-underline" onClick={() => setIsMenuOpen(false)}>
            <img src={siteLogo} alt="Logo" className="h-[30px]" />
          </Link>
          <button onClick={() => setIsMenuOpen(false)} className="bg-transparent border-none text-[1.8rem] text-text-dark cursor-pointer">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex flex-col gap-[30px]">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              href={link.path} 
              className="text-[1.3rem] font-bold text-text-dark no-underline hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
