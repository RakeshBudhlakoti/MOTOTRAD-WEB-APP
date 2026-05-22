'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout, setCredentials } from '@/store/slices/authSlice';
import { userService } from '@/services/user.service';
import { useAppQuery } from '@/hooks/useApp';
import Link from 'next/link';
import Swal from 'sweetalert2';
import apiClient from '@/lib/axios';
import BalancePaymentModal from '@/components/features/BalancePaymentModal';
import { useQueryClient } from '@tanstack/react-query';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bidFilter, setBidFilter] = useState('ongoing');
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedOrderForBalance, setSelectedOrderForBalance] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Real data fetching
  const { data: bidsData = [] } = useAppQuery(['my-bids'], () => userService.getMyBids(), { enabled: !!user && isMounted });
  const { data: ordersData = [] } = useAppQuery(['my-orders'], () => userService.getMyOrders(), { enabled: !!user && isMounted });

  const bids = bidsData as any[];
  const orders = ordersData as any[];

  // Sync profile from backend on mount
  useEffect(() => {
    if (user && isMounted && token) {
      userService.getProfile().then(updatedUser => {
        dispatch(setCredentials({ user: updatedUser, token: token }));
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }).catch(err => console.error('Failed to sync profile:', err));
    }
  }, [isMounted, token, dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'bids', 'orders', 'details'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMounted && !user) {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/auth/login');
      }
    }
  }, [user, router, isMounted]);

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C90000',
      cancelButtonColor: '#111',
      confirmButtonText: 'Yes, Sign Out',
      customClass: {
        popup: 'rounded-[25px] font-poppins',
        confirmButton: 'rounded-xl px-8 py-3 font-bold uppercase',
        cancelButton: 'rounded-xl px-8 py-3 font-bold uppercase'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        dispatch(logout());
        router.push('/');
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'File size must be less than 5MB', 'error');
      return;
    }

    setIsUpdating(true);
    setUploadProgress(10);

    try {
      const { data: { uploadUrl, fileUrl } } = await apiClient.post('/upload/presigned-url', {
        fileName: file.name,
        fileType: file.type,
        folder: 'profiles'
      });

      setUploadProgress(40);

      try {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
      } catch (uploadError) {
        console.error('S3 Upload failed:', uploadError);
        throw new Error('Image upload blocked by CORS policy. Please check S3 bucket configuration.');
      }

      setUploadProgress(80);

      const updatedUser = await userService.updateProfile({ avatar: fileUrl });
      
      dispatch(setCredentials({ user: updatedUser, token: token! }));
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setUploadProgress(100);
      Swal.fire({
        icon: 'success',
        title: 'Avatar Updated',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (err) {
      console.error('Avatar update failed:', err);
      Swal.fire('Error', 'Failed to update avatar', 'error');
    } finally {
      setIsUpdating(false);
      setUploadProgress(0);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const updatedUser = await userService.updateProfile(formData);
      
      dispatch(setCredentials({ user: updatedUser, token: token! }));
      localStorage.setItem('user', JSON.stringify(updatedUser));

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your account details have been saved successfully.',
        confirmButtonColor: '#C90000',
        customClass: {
          popup: 'rounded-[25px] font-poppins',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase'
        }
      });
    } catch (err) {
      console.error('Profile update failed:', err);
      Swal.fire('Error', 'Failed to update profile details', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'bids', label: 'My Bids', icon: 'fas fa-gavel' },
    { id: 'orders', label: 'My Orders', icon: 'fas fa-shopping-bag' },
    { id: 'details', label: 'Account Details', icon: 'fas fa-user-edit' },
  ];

  // Group bids by auction to show only the highest bid per auction
  const groupedBids = Object.values(bids.reduce((acc: any, bid: any) => {
    const auctionId = bid.auctionId;
    if (!acc[auctionId] || Number(bid.amount) > Number(acc[auctionId].amount)) {
      acc[auctionId] = bid;
    }
    return acc;
  }, {}));

  const winningBids = (groupedBids as any[]).filter((b: any) => b.status === 'WINNING' || b.auction?.highestBidderId === user.id);
  const ongoingBids = (groupedBids as any[]).filter((b: any) => b.status !== 'WINNING' && b.auction?.status === 'ACTIVE');

  return (
    <main className="bg-[#F8FAFC] min-h-screen py-10 lg:py-16 font-poppins text-[#111]">
      <div className="container max-w-[1300px]">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 lg:gap-12 items-start">
          
          <aside className="lg:bg-white lg:rounded-[35px] lg:shadow-[0_20px_50px_rgba(0,0,0,0.03)] lg:border lg:border-[#F1F5F9] lg:overflow-hidden lg:sticky lg:top-28">
            <div className="hidden lg:flex p-8 lg:p-10 flex-col items-center text-center border-b border-[#F8FAFC]">
                <div className="relative mb-8">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-primary/10 group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=C90000&color=fff&bold=true&size=128`} 
                          alt="Profile" 
                          className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${isUpdating ? 'opacity-50' : ''}`} 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-camera text-white text-xl"></i>
                        </div>
                        {isUpdating && uploadProgress > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                             <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 right-2 w-10 h-10 bg-white border border-[#E2E8F0] text-[#111] rounded-full flex items-center justify-center shadow-lg hover:text-primary hover:border-primary/30 transition-all z-10"
                        title="Change Profile Picture"
                    >
                        <i className="fas fa-camera text-sm"></i>
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpdate} accept="image/*" className="hidden" />
                
                <h2 className="text-[1.4rem] font-black text-[#111] mb-1 uppercase tracking-tight">{user.firstName} {user.lastName}</h2>
                <p className={`text-[0.85rem] font-semibold flex items-center gap-2 mb-4 ${user.isProMember ? 'text-primary' : 'text-[#64748B]'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${user.isProMember ? 'bg-primary' : 'bg-green-500'}`}></span>
                    {user.isProMember ? 'PRO Member' : 'Verified Member'}
                </p>
                <div className="bg-[#F8FAFC] px-4 py-1.5 rounded-full text-[0.7rem] font-bold text-[#111] uppercase tracking-wider">
                    {user.role?.name || 'Buyer'}
                </div>
            </div>



            <nav className="grid grid-cols-2 lg:flex lg:flex-col gap-2 p-2 lg:p-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center justify-center lg:justify-start gap-2.5 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-[0.8rem] lg:text-[0.9rem] transition-all duration-300 ${activeTab === item.id ? 'bg-primary text-white shadow-md lg:shadow-[0_10px_25px_rgba(201,0,0,0.2)]' : 'bg-white lg:bg-transparent text-[#64748B] border border-[#F1F5F9] lg:border-none hover:bg-[#F8FAFC] hover:text-[#111]'}`}
                    >
                        <i className={`${item.icon} text-sm lg:text-base`}></i>
                        <span>{item.label}</span>
                    </button>
                ))}
                
                <div className="hidden lg:block h-px bg-[#F8FAFC] my-2 mx-6"></div>
                
                <button
                    onClick={handleLogout}
                    className="col-span-2 flex items-center justify-center lg:justify-start gap-2.5 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-[0.8rem] lg:text-[0.9rem] text-[#C90000] bg-white lg:bg-transparent border border-[#F1F5F9] lg:border-none hover:bg-red-50 transition-all duration-300"
                >
                    <i className="fas fa-sign-out-alt text-sm lg:text-base"></i>
                    <span>Sign Out</span>
                </button>
            </nav>
          </aside>

          <div className="flex flex-col gap-8">
            <div className="hidden lg:flex bg-white rounded-[30px] p-8 lg:p-10 shadow-sm border border-[#F1F5F9] flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                    <span className="text-primary font-black text-[0.75rem] uppercase tracking-[2px] block mb-2">Welcome Back</span>
                    <h1 className="text-[1.8rem] lg:text-[2.2rem] font-black text-[#111] uppercase tracking-tight">
                        {activeTab === 'dashboard' && 'Account Dashboard'}
                        {activeTab === 'bids' && 'My Bidding History'}
                        {activeTab === 'orders' && 'My Orders'}
                        {activeTab === 'details' && 'Account Settings'}
                    </h1>
                </div>
                <div className="flex items-center gap-4 text-[0.85rem] font-bold text-[#64748B]">
                    <span className="bg-[#F8FAFC] px-5 py-2.5 rounded-xl border border-[#F1F5F9]">
                        Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true 
                        }) : 'First Login'}
                    </span>
                </div>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Membership Widget */}
                        {user.isProMember && (
                            <div className="flex lg:hidden items-center justify-between bg-[#111] border border-white/5 text-white rounded-2xl p-4 shadow-sm md:col-span-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                                        <i className="fas fa-gem text-sm"></i>
                                    </div>
                                    <span className="text-[0.8rem] font-black uppercase tracking-wider">Pro Member</span>
                                </div>
                                <span className="bg-[#C90000] text-white px-3.5 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider">
                                    ACTIVE
                                </span>
                            </div>
                        )}

                        <div className={`md:col-span-3 overflow-hidden rounded-[25px] lg:rounded-[30px] border shadow-md transition-all ${user.isProMember ? 'bg-[#111] border-white/5 text-white' : 'bg-white border-[#F1F5F9] text-[#111]'} ${user.isProMember ? 'hidden lg:block' : ''}`}>
                            <div className="relative p-5 lg:p-10 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-8">
                                {user.isProMember && (
                                    <div className="absolute top-0 right-0 p-10 opacity-10 hidden md:block">
                                        <i className="fas fa-gem text-[8rem]"></i>
                                    </div>
                                )}
                                <div className="relative z-10 text-center md:text-left flex flex-col items-center md:items-start w-full">
                                    <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2 lg:mb-4">
                                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center text-sm lg:text-lg ${user.isProMember ? 'bg-primary/20 text-primary' : 'bg-[#F8FAFC] text-[#64748B]'}`}>
                                            <i className="fas fa-gem"></i>
                                        </div>
                                        <span className={`text-[0.7rem] lg:text-[0.8rem] font-black uppercase tracking-[1.5px] ${user.isProMember ? 'text-primary' : 'text-[#64748B]'}`}>
                                            {user.isProMember ? 'Pro Membership Active' : 'Standard Account'}
                                        </span>
                                    </div>
                                    <h2 className="text-[1.3rem] lg:text-[2.2rem] font-black uppercase tracking-tight leading-none mb-2 lg:mb-4">
                                        {user.isProMember ? 'Elite Bidding Unlocked' : 'Upgrade to Pro'}
                                    </h2>
                                    <p className={`text-[0.85rem] lg:text-[1rem] font-medium max-w-xl hidden md:block ${user.isProMember ? 'text-[#888]' : 'text-[#64748B]'}`}>
                                        {user.isProMember 
                                            ? 'Your premium access is permanent. Enjoy unlimited bidding and instant purchases for a lifetime.' 
                                            : 'Unlock the full potential of Mototrad. Place unlimited bids and get exclusive access to premium auctions.'}
                                    </p>
                                </div>
                                <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
                                    {user.isProMember ? (
                                        <div className="bg-white/5 border border-white/10 backdrop-blur-md py-2 px-5 md:py-4 md:px-8 rounded-xl lg:rounded-2xl flex md:flex-col items-center justify-between md:justify-center">
                                            <span className="text-[0.6rem] lg:text-[0.7rem] font-black text-primary uppercase tracking-widest md:mb-1">Status</span>
                                            <span className="text-[0.9rem] lg:text-[1.2rem] font-black text-white uppercase tracking-tighter italic">ACTIVE PRO</span>
                                        </div>
                                    ) : (
                                        <Link 
                                            href="/membership"
                                            className="bg-primary text-white w-full md:w-auto px-6 py-3 lg:px-10 lg:py-4 rounded-xl font-black text-[0.8rem] lg:text-[0.9rem] uppercase tracking-widest transition-all hover:scale-105 shadow-md active:scale-95 flex items-center justify-center"
                                        >
                                            Get Pro Now
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { setActiveTab('bids'); setBidFilter('ongoing'); }}
                            className="bg-white p-4 lg:p-6 rounded-[22px] lg:rounded-[30px] shadow-sm border border-[#F1F5F9] flex items-center gap-4 cursor-pointer hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-95 duration-300 text-left w-full"
                        >
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex flex-shrink-0 items-center justify-center text-base lg:text-xl shadow-sm bg-blue-50 text-blue-500">
                                <i className="fas fa-gavel"></i>
                            </div>
                            <div>
                                <span className="text-[#64748B] text-[0.7rem] lg:text-[0.8rem] font-extrabold uppercase tracking-wider block">Total Bids</span>
                                <span className="text-[1.4rem] lg:text-[1.8rem] font-black text-[#111] block leading-none mt-1">{bids.length}</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { setActiveTab('bids'); setBidFilter('won'); }}
                            className="bg-white p-4 lg:p-6 rounded-[22px] lg:rounded-[30px] shadow-sm border border-[#F1F5F9] flex items-center gap-4 cursor-pointer hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-95 duration-300 text-left w-full"
                        >
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex flex-shrink-0 items-center justify-center text-base lg:text-xl shadow-sm bg-yellow-50 text-yellow-500">
                                <i className="fas fa-trophy"></i>
                            </div>
                            <div>
                                <span className="text-[#64748B] text-[0.7rem] lg:text-[0.8rem] font-extrabold uppercase tracking-wider block">Auctions Won</span>
                                <span className="text-[1.4rem] lg:text-[1.8rem] font-black text-[#111] block leading-none mt-1">{winningBids.length}</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className="bg-white p-4 lg:p-6 rounded-[22px] lg:rounded-[30px] shadow-sm border border-[#F1F5F9] flex items-center gap-4 cursor-pointer hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-95 duration-300 text-left w-full"
                        >
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex flex-shrink-0 items-center justify-center text-base lg:text-xl shadow-sm bg-green-50 text-green-500">
                                <i className="fas fa-shopping-cart"></i>
                            </div>
                            <div>
                                <span className="text-[#64748B] text-[0.7rem] lg:text-[0.8rem] font-extrabold uppercase tracking-wider block">Items Bought</span>
                                <span className="text-[1.4rem] lg:text-[1.8rem] font-black text-[#111] block leading-none mt-1">{orders.length}</span>
                            </div>
                        </button>

                    </div>
                )}

                {activeTab === 'bids' && (
                    <div className="bg-white rounded-[35px] shadow-sm border border-[#F1F5F9] overflow-hidden">
                        <div className="p-8 border-b border-[#F8FAFC] flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0]">
                                <button 
                                  onClick={() => setBidFilter('ongoing')}
                                  className={`px-8 py-2.5 rounded-xl font-bold text-[0.8rem] uppercase tracking-wider transition-all ${bidFilter === 'ongoing' ? 'bg-white text-primary shadow-sm' : 'text-[#64748B]'}`}
                                >
                                  Ongoing
                                </button>
                                <button 
                                  onClick={() => setBidFilter('won')}
                                  className={`px-8 py-2.5 rounded-xl font-bold text-[0.8rem] uppercase tracking-wider transition-all ${bidFilter === 'won' ? 'bg-white text-primary shadow-sm' : 'text-[#64748B]'}`}
                                >
                                  Won
                                </button>
                            </div>
                            <div className="text-[0.8rem] font-bold text-[#64748B] italic">
                                showing {bidFilter === 'ongoing' ? `${ongoingBids.length} ongoing` : `${winningBids.length} won`} bids
                            </div>
                        </div>
                        
                        <div className="p-4 lg:p-8">
                            {/* Mobile View: Cards */}
                            <div className="lg:hidden flex flex-col gap-4">
                                {(bidFilter === 'ongoing' ? ongoingBids : winningBids).map((bid: any) => (
                                    <div key={bid.id} className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#F1F5F9] flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E2E8F0]">
                                                <img src={bid.auction?.product?.media?.[0]?.url || "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=200"} className="w-full h-full object-cover" alt="Product" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[#111] text-[0.95rem] leading-tight mb-1">{bid.auction?.product?.title || 'Unknown Item'}</h4>
                                                <span className="text-[0.65rem] font-black text-[#64748B] uppercase tracking-widest">ID: {bid.auction?.id?.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-white">
                                            <div>
                                                <span className="text-[0.6rem] font-black text-[#64748B] uppercase block mb-1">Current</span>
                                                <span className="font-black text-[#111]">${Number(bid.auction?.currentBid || 0).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-[0.6rem] font-black text-[#64748B] uppercase block mb-1">Your Bid</span>
                                                <span className="font-black text-primary">${Number(bid.amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[0.7rem] font-bold text-[#64748B]">{new Date(bid.createdAt).toLocaleDateString()}</span>
                                            <div className="flex gap-2">
                                                <Link href={`/auctions/${bid.auction?.id}`} className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#111] px-4 py-2 rounded-lg font-bold text-[0.7rem] uppercase tracking-wider">View</Link>
                                                {bidFilter === 'won' && orders.find(o => o.auctionId === bid.auctionId)?.status !== 'FULLY_PAID' && (
                                                    <button 
                                                        onClick={() => setActiveTab('orders')}
                                                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-[0.7rem] uppercase tracking-wider shadow-md"
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(bidFilter === 'ongoing' ? ongoingBids : winningBids).length === 0 && (
                                    <div className="py-10 text-center text-[#94A3B8] font-bold italic">No bids found.</div>
                                )}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-[#F1F5F9]">
                                            <th className="pb-6 text-[#111] font-black uppercase text-[0.7rem] tracking-[2px]">Product</th>
                                            <th className="pb-6 text-[#111] font-black uppercase text-[0.7rem] tracking-[2px]">Current Bid</th>
                                            <th className="pb-6 text-[#111] font-black uppercase text-[0.7rem] tracking-[2px]">Your Bid</th>
                                            <th className="pb-6 text-[#111] font-black uppercase text-[0.7rem] tracking-[2px]">Date</th>
                                            <th className="pb-6 text-[#111] font-black uppercase text-[0.7rem] tracking-[2px]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F8FAFC]">
                                        {(bidFilter === 'ongoing' ? ongoingBids : winningBids).map((bid: any) => (
                                            <tr key={bid.id} className="group">
                                                <td className="py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#F1F5F9]">
                                                            <img 
                                                              src={bid.auction?.product?.media?.[0]?.url || "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=200"} 
                                                              className="w-full h-full object-cover" 
                                                              alt="Product" 
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-[#111] text-[0.9rem] block leading-tight">{bid.auction?.product?.title || 'Unknown Item'}</span>
                                                                <span className="bg-[#F8FAFC] text-[#64748B] text-[0.6rem] font-black px-2 py-0.5 rounded-md border border-[#E2E8F0] uppercase tracking-tighter">
                                                                    {bids.filter((b: any) => (b.auctionId || b.auction?.id) === (bid.auctionId || bid.auction?.id)).length} Bids Made
                                                                </span>
                                                                {(() => {
                                                                    const order = orders.find(o => o.auctionId === (bid.auctionId || bid.auction?.id));
                                                                    console.log('Checking Bid:', bid.auction?.id, 'Order found:', order?.id, 'Status:', order?.status);
                                                                    if (order?.status === 'FULLY_PAID') {
                                                                        return (
                                                                            <span className="bg-green-50 text-green-600 text-[0.6rem] font-black px-2 py-0.5 rounded-md border border-green-100 uppercase tracking-tighter flex items-center gap-1">
                                                                                <i className="fas fa-check-circle text-[0.7rem]"></i> PAID
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                            <span className="text-[0.7rem] font-bold text-[#64748B] uppercase">Auction ID: {bid.auction?.id?.slice(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 font-black text-[#111] text-[1.1rem]">${Number(bid.auction?.currentBid || 0).toLocaleString()}</td>
                                                <td className="py-6 font-bold text-primary text-[1.1rem]">${Number(bid.amount).toLocaleString()}</td>
                                                <td className="py-6 text-[0.8rem] font-bold text-[#64748B]">{new Date(bid.createdAt).toLocaleDateString()}</td>
                                                <td className="py-6">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/auctions/${bid.auction?.id}`} className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#111] px-4 py-2.5 rounded-xl font-bold text-[0.7rem] uppercase tracking-wider hover:bg-white hover:border-primary/30 transition-all shadow-sm">View Item</Link>
                                                        {bidFilter === 'won' && orders.find(o => o.auctionId === bid.auctionId)?.status !== 'FULLY_PAID' && (
                                                            <button 
                                                              onClick={() => setActiveTab('orders')}
                                                              className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-[0.7rem] uppercase tracking-wider hover:bg-primary-hover hover:-translate-y-0.5 transition-all shadow-md active:scale-95"
                                                            >
                                                              Pay Now
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(bidFilter === 'ongoing' ? ongoingBids : winningBids).length === 0 && (
                                    <div className="py-20 text-center text-[#94A3B8] font-bold italic">No bids found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="grid grid-cols-1 gap-6">
                        {orders.length > 0 ? orders.map((order: any) => {
                            const paidAmount = order.payments
                                ?.filter((p: any) => p.status === 'COMPLETED')
                                .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                            const remainingAmount = Number(order.totalAmount) - paidAmount;
                            const hasBalance = remainingAmount > 0;

                            return (
                                <div key={order.id} className="bg-white rounded-[25px] lg:rounded-[35px] p-5 lg:p-10 shadow-sm border border-[#F1F5F9] flex flex-col md:flex-row gap-6 lg:gap-8 items-center relative overflow-hidden group">
                                    {hasBalance && (
                                        <div className="absolute top-0 right-0 bg-primary/10 text-primary px-4 lg:px-6 py-1.5 rounded-bl-[15px] lg:rounded-bl-[20px] text-[0.6rem] lg:text-[0.65rem] font-black uppercase tracking-widest z-10">
                                            Balance Due
                                        </div>
                                    )}
                                    <div className="w-full md:w-32 lg:w-48 aspect-square rounded-[20px] lg:rounded-[25px] overflow-hidden border border-[#F1F5F9] flex-shrink-0">
                                        <img 
                                          src={order.auction?.product?.media?.[0]?.url || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400"} 
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                          alt="Order" 
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3 lg:gap-4 w-full">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 lg:gap-3 mb-2">
                                                    <span className="text-[0.6rem] lg:text-[0.65rem] font-black text-primary uppercase tracking-[2px] bg-primary/5 px-2.5 py-1 rounded-full">Order #{order.orderNumber}</span>
                                                    <span className={`text-[0.6rem] lg:text-[0.65rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${hasBalance ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-500'}`}>
                                                        {order.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h3 className="text-[1.1rem] lg:text-[1.3rem] font-black text-[#111] uppercase tracking-tight">{order.auction?.product?.title || 'Unknown Item'}</h3>
                                            </div>
                                            <div className="sm:text-right w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                                                <span className="text-[0.7rem] font-bold text-[#64748B] sm:order-2">Total Price</span>
                                                <span className="text-[1.3rem] lg:text-[1.6rem] font-black text-[#111] leading-none sm:order-1">${Number(order.totalAmount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 py-4 lg:py-5 border-y border-[#F8FAFC]">
                                            <div>
                                                <span className="text-[0.6rem] lg:text-[0.65rem] font-black text-[#64748B] uppercase tracking-wider block mb-1">Base Price</span>
                                                <span className="font-bold text-[#111] text-[0.85rem] lg:text-[0.9rem]">${Number(order.baseAmount || 0).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-[0.6rem] lg:text-[0.65rem] font-black text-[#64748B] uppercase tracking-wider block mb-1">
                                                    Commission ({order.commissionType === 'PERCENTAGE' ? `${Number(order.commissionRate)}%` : 'Flat'})
                                                </span>
                                                <span className="font-bold text-primary text-[0.85rem] lg:text-[0.9rem]">+${Number(order.commissionAmount || 0).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-[0.6rem] lg:text-[0.65rem] font-black text-[#64748B] uppercase tracking-wider block mb-1">Paid</span>
                                                <span className="font-black text-green-600 text-[0.9rem] lg:text-[1rem]">${paidAmount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-[0.6rem] lg:text-[0.65rem] font-black text-[#64748B] uppercase tracking-wider block mb-1">Remaining</span>
                                                <span className={`font-black text-[0.9rem] lg:text-[1rem] ${hasBalance ? 'text-primary' : 'text-[#888]'}`}>
                                                    ${remainingAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 mt-1">
                                            {hasBalance && (
                                                <button 
                                                    onClick={() => setSelectedOrderForBalance(order)}
                                                    className="w-full sm:w-auto bg-primary text-white px-6 lg:px-8 py-3 lg:py-3.5 rounded-xl font-black text-[0.75rem] lg:text-[0.8rem] uppercase tracking-wider hover:bg-primary-hover hover:-translate-y-1 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <i className="fas fa-wallet text-[0.9rem]"></i>
                                                    {(() => {
                                                        const depositPayment = order.payments?.find((p: any) => p.paymentType === 'DEPOSIT');
                                                        const isDepositPaid = depositPayment?.status === 'COMPLETED' || order.status === 'DEPOSIT_PAID' || order.status === 'FULLY_PAID';
                                                        return isDepositPaid ? 'Pay Remaining Balance' : 'Pay Deposit / Full Price';
                                                    })()}
                                                </button>
                                            )}
                                            <button className="w-full sm:w-auto bg-[#F8FAFC] border border-[#E2E8F0] text-[#111] px-6 lg:px-8 py-3 lg:py-3.5 rounded-xl font-bold text-[0.75rem] lg:text-[0.8rem] uppercase tracking-wider hover:bg-white hover:border-primary/30 transition-all flex items-center justify-center gap-2">
                                                <i className="fas fa-truck text-[0.9rem]"></i>
                                                Track Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                          <div className="bg-white rounded-[35px] p-20 text-center text-[#94A3B8] font-bold italic shadow-sm border border-[#F1F5F9]">No orders found yet.</div>
                        )}
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="bg-white rounded-[25px] lg:rounded-[35px] p-6 lg:p-12 shadow-sm border border-[#F1F5F9]">

                        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                            {/* Mobile Avatar Upload Card (Flex-col stacked on mobile only, hidden on desktop) */}
                            <div className="md:col-span-2 flex lg:hidden bg-[#F8FAFC] rounded-[25px] p-6 border border-[#E2E8F0] shadow-sm mb-4 flex-col items-center text-center gap-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-primary/5 flex items-center justify-center relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <img 
                                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=C90000&color=fff&bold=true&size=128`} 
                                          alt="Profile" 
                                          className={`w-full h-full object-cover ${isUpdating ? 'opacity-50' : ''}`} 
                                        />
                                        {isUpdating && uploadProgress > 0 && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                        )}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-[#E2E8F0] text-[#111] rounded-full flex items-center justify-center shadow-md hover:text-primary z-10"
                                        title="Change Profile Picture"
                                    >
                                        <i className="fas fa-camera text-[0.8rem]"></i>
                                    </button>
                                </div>
                                
                                <div className="flex flex-col items-center gap-2">
                                    <h2 className="text-[1.3rem] font-black text-[#111] uppercase tracking-tight mb-1">{user.firstName} {user.lastName}</h2>
                                    {user.isProMember ? (
                                        <span className="bg-[#C90000] text-white px-5 py-1.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider shadow-sm">
                                            PRO MEMBER
                                        </span>
                                    ) : (
                                        <span className="bg-[#EEE] text-[#888] px-5 py-1.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider">
                                            STANDARD MEMBER
                                        </span>
                                    )}
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-white border border-[#E2E8F0] text-[#111] py-3 rounded-xl font-bold text-[0.8rem] uppercase tracking-wider hover:border-primary/30 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-upload text-[#64748B]"></i> Update Pic
                                </button>
                            </div>

                            <div className="md:col-span-2 border-b border-[#F8FAFC] pb-4 lg:pb-6 mb-2">
                                <h3 className="text-[1.1rem] lg:text-[1.2rem] font-black text-[#111] uppercase tracking-wider">Personal Information</h3>
                                <p className="text-[#64748B] text-[0.8rem] lg:text-[0.85rem] font-medium">Manage your personal data and how it appears across Mototrad.</p>
                            </div>
                            
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <label className="text-[0.65rem] lg:text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">First Name</label>
                                <input 
                                  type="text" 
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-3.5 lg:p-4 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.85rem] lg:text-[0.9rem]" 
                                />
                            </div>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <label className="text-[0.65rem] lg:text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Last Name</label>
                                <input 
                                  type="text" 
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-3.5 lg:p-4 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.85rem] lg:text-[0.9rem]" 
                                />
                            </div>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <label className="text-[0.65rem] lg:text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Email Address</label>
                                <input type="email" defaultValue={user.email} disabled className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-xl p-3.5 lg:p-4 outline-none font-bold text-[#64748B] text-[0.85rem] lg:text-[0.9rem] opacity-70 cursor-not-allowed" />
                            </div>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <label className="text-[0.65rem] lg:text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Phone Number</label>
                                <input 
                                  type="tel" 
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-3.5 lg:p-4 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.85rem] lg:text-[0.9rem]" 
                                />
                            </div>

                            <div className="md:col-span-2 border-b border-[#F8FAFC] pb-4 lg:pb-6 mt-6 lg:mt-8 mb-2">
                                <h3 className="text-[1.1rem] lg:text-[1.2rem] font-black text-[#111] uppercase tracking-wider">Security</h3>
                                <p className="text-[#64748B] text-[0.8rem] lg:text-[0.85rem] font-medium">Update your password to keep your account secure.</p>
                            </div>

                            <div className="flex flex-col gap-2 lg:gap-3">
                                <label className="text-[0.65rem] lg:text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Current Password</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-3.5 lg:p-4 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.85rem] lg:text-[0.9rem]" />
                            </div>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <label className="text-[0.65rem] lg:text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">New Password</label>
                                <input type="password" placeholder="New Password" className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-3.5 lg:p-4 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.85rem] lg:text-[0.9rem]" />
                            </div>

                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button 
                                  type="submit" 
                                  disabled={isUpdating}
                                  className="w-full sm:w-auto bg-primary text-white px-10 lg:px-12 py-3.5 lg:py-4 rounded-xl font-black shadow-lg hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest text-[0.85rem] lg:text-[0.9rem] disabled:opacity-50"
                                >
                                  {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {selectedOrderForBalance && (
        <BalancePaymentModal 
          order={selectedOrderForBalance}
          onClose={() => setSelectedOrderForBalance(null)}
          onSuccess={() => {
            setSelectedOrderForBalance(null);
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });
          }}
        />
      )}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
