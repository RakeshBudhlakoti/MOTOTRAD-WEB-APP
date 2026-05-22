'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { ADMIN_CONSTANTS } from '@/constants/app.constants';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      router.push('/auth/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${ADMIN_CONSTANTS.API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.message === 'object' && data.message !== null
            ? data.message.message || JSON.stringify(data.message)
            : data.message || 'Failed to reset password';
        throw new Error(errorMsg);
      }
      
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200/50 m-4"
      >
        <div>
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-inner">
                {isSuccess ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <Lock className="w-8 h-8 text-blue-600" />
                )}
             </div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-2">
               {isSuccess ? 'Password Updated' : 'Create Password'}
             </h1>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
               {isSuccess 
                 ? "Changed successfully. You can now login." 
                 : "Enter a strong, secure password below."}
             </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium shadow-sm"
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-wider text-[11px] flex items-center justify-center gap-2"
                isLoading={isLoading}
              >
                Update Password <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>
          ) : (
            <Link href="/auth/login">
              <Button 
                type="button" 
                variant="primary" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-wider text-[11px]"
              >
                Go to Login
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
