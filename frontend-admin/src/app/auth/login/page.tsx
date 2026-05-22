'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';
import { ADMIN_CONSTANTS } from '@/constants/app.constants';

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to extract nested string errors from API response objects
  const getErrorMessage = (message: any): string => {
    if (typeof message === 'string') return message;
    if (typeof message === 'object' && message !== null) {
      if (typeof message.message === 'string') return message.message;
      if (Array.isArray(message.message)) return message.message.join(', ');
      return JSON.stringify(message);
    }
    return 'Authentication failed';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${ADMIN_CONSTANTS.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = getErrorMessage(data.message);
        throw new Error(errorMsg);
      }

      const allowedRoles = ['super_admin', 'admin', 'seller'];
      const userRole = data.user.role?.name?.toLowerCase() || data.user.role?.toLowerCase() || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access. Administrative privileges required.');
      }

      // Update Redux Store
      dispatch(setCredentials({
        user: data.user,
        token: data.access_token,
      }));

      // Store in LocalStorage for client
      localStorage.setItem('adminToken', data.access_token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      // Store in Cookies for Next.js Middleware
      document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400; SameSite=Lax`;

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden"
      style={{
        backgroundImage: "linear-gradient(rgba(241, 245, 249, 0.45), rgba(241, 245, 249, 0.95)), url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200/50 m-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4 shadow-inner">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{ADMIN_CONSTANTS.APP_NAME}</h1>
          <p className="text-slate-500 text-[10px] font-black mt-2 uppercase tracking-widest">Management Terminal Login</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs text-center font-bold">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Email or Username</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mototrad.com or username"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium shadow-sm"
            />
            <div className="flex justify-end pr-1 pt-1">
              <Link href="/auth/forgot-password" className="text-[10px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 uppercase tracking-wider text-[11px]"
          >
            {loading ? 'Verifying Credentials...' : 'Access Terminal'}
          </button>
        </form>

        <p className="mt-8 text-center text-[9px] text-slate-400 font-extrabold uppercase tracking-[2px]">
          Authorized Personnel Only • Secure Session
        </p>
      </div>
    </div>
  );
}
