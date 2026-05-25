'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/utils/error';

export default function MembershipPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { token } = useSelector((state: RootState) => state.auth);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const [membershipFee, setMembershipFee] = useState<number>(5);

    useEffect(() => {
        fetchStatus();
        const fetchSettings = async () => {
            try {
                const { settingsService } = await import('@/services/settings.service');
                const settings = await settingsService.getPublic();
                if (settings && settings.membership_fee) {
                    setMembershipFee(Number(settings.membership_fee));
                }
            } catch (err) {
                console.error('Failed to load membership fee setting:', err);
            }
        };
        fetchSettings();
    }, []);

    const fetchStatus = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get('/subscriptions/status');
            setStatus(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] py-16 lg:py-24">
            <div className="container max-w-5xl px-4 mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
                        Exclusive Access
                    </span>
                    <h1 className="text-[2.2rem] lg:text-[3.2rem] font-black text-[#0F172A] tracking-tight leading-tight">
                        Unlock <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Pro</span> Membership
                    </h1>
                    <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 mx-auto rounded-full mt-4 mb-4" />
                    <p className="text-[#475569] text-sm lg:text-base font-medium max-w-2xl mx-auto leading-relaxed px-4">
                        Join the elite community of Mototrad. Place unlimited bids, buy items instantly, and get priority access to premium auctions.
                    </p>
                </div>

                {status?.isProMember ? (
                    <div className="bg-white rounded-[2rem] p-10 lg:p-16 border-2 border-green-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] text-center animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-40"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <i className="fas fa-gem text-4xl text-green-600"></i>
                            </div>
                            <h2 className="text-[2.5rem] font-black text-[#111] mb-2">Lifetime Pro Access</h2>
                            <p className="text-[#64748B] font-bold text-[1.1rem] mb-10">
                                Your account is permanently upgraded to Pro. Enjoy all exclusive benefits!
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <button 
                                    onClick={() => router.push('/auctions')}
                                    className="bg-primary text-white px-10 py-4 rounded-xl font-black text-[1rem] uppercase tracking-wider transition-all hover:scale-105 shadow-xl active:scale-95"
                                >
                                    Start Bidding Now
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-8 items-stretch">
                        {/* Benefits Card */}
                        <div className="bg-[#111] rounded-[2rem] p-10 lg:p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <i className="fas fa-gem text-[10rem]"></i>
                            </div>
                            <div>
                                <h3 className="text-[2rem] font-black mb-8 leading-tight">Pro Benefits</h3>
                                <ul className="space-y-6">
                                    {[
                                        'Place Unlimited Bids',
                                        'Instant "Buy Now" Access',
                                        'Priority Order Checkout',
                                        'Real-time Outbid Alerts',
                                        'Certified Seller Access',
                                        'Expert Support 24/7'
                                    ].map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-4 text-[1.05rem] font-bold text-[#AAA] hover:text-white transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <i className="fas fa-check text-[0.7rem] text-primary"></i>
                                            </div>
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-12 pt-8 border-t border-white/10">
                                <p className="text-[#666] text-[0.8rem] font-bold uppercase tracking-widest mb-2">One-time Fee</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[3rem] font-black">${membershipFee.toFixed(2)}</span>
                                    <span className="text-[#888] font-bold">/ Lifetime</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Card */}
                        <div className="bg-white rounded-[2rem] p-10 lg:p-12 border border-[#E2E8F0] shadow-xl flex flex-col justify-center text-center">
                            <div className="mb-10">
                                <h3 className="text-[1.8rem] font-black text-[#111] mb-2 uppercase tracking-tight">Activate Now</h3>
                                <p className="text-[#64748B] font-medium">Safe and secure payment via PayPal</p>
                            </div>

                             {verifying ? (
                                <div className="py-20 flex flex-col items-center">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="font-bold text-[#111]">Activating Pro Status...</p>
                                </div>
                            ) : token ? (
                                    <div className="space-y-6">
                                        <PayPalButtons
                                            style={{ layout: "vertical", shape: "pill", label: "pay" }}
                                            createOrder={async () => {
                                                try {
                                                    const { data } = await axios.post('/subscriptions/create-order');
                                                    return data.orderId;
                                                } catch (err: any) {
                                                    toast.error(getErrorMessage(err) || 'Failed to create order');
                                                    return "";
                                                }
                                            }}
                                            onApprove={async (data) => {
                                                setVerifying(true);
                                                try {
                                                    const res = await axios.post('/subscriptions/capture', { orderId: data.orderID });
                                                    toast.success('Lifetime Pro Membership Activated!');
                                                    
                                                    // Update Redux Store
                                                    if (res.data.user && token) {
                                                        dispatch(setCredentials({ user: res.data.user, token }));
                                                        localStorage.setItem('user', JSON.stringify(res.data.user));
                                                    }
                                                    
                                                    await fetchStatus();
                                                } catch (err: any) {
                                                    toast.error(getErrorMessage(err) || 'Verification failed');
                                                } finally {
                                                    setVerifying(false);
                                                }
                                            }}
                                        />
                                    
                                    <div className="pt-6">
                                        <p className="text-[0.75rem] text-[#94A3B8] font-medium italic">
                                            This is a one-time payment for permanent Pro access. No recurring charges.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 space-y-8">
                                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                                        <i className="fas fa-lock text-3xl text-primary/40"></i>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-bold text-[#111] text-[1.1rem]">Sign in to Subscribe</p>
                                        <p className="text-[#64748B] text-[0.9rem]">You need to be logged in to activate your lifetime membership.</p>
                                    </div>
                                    <Link 
                                        href="/auth/login?redirect=/membership"
                                        className="bg-[#111] text-white w-full py-4 rounded-xl font-black text-[0.9rem] uppercase tracking-widest transition-all hover:bg-primary shadow-xl inline-block no-underline"
                                    >
                                        Login to Get Pro
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
