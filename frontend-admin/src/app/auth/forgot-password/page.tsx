'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { ADMIN_CONSTANTS } from '@/constants/app.constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');

    setIsLoading(true);
    try {
      const res = await fetch(`${ADMIN_CONSTANTS.API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.message === 'object' && data.message !== null
            ? data.message.message || JSON.stringify(data.message)
            : data.message || 'Failed to send reset link';
        throw new Error(errorMsg);
      }

      setIsSent(true);
      toast.success('Password reset link sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden font-['Source_Sans_Pro',_sans-serif]"
      style={{
        backgroundImage: "linear-gradient(rgba(241, 245, 249, 0.45), rgba(241, 245, 249, 0.95)), url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200/50 m-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4 shadow-inner">
             <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
           </div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">
             Mototrad <span className="text-blue-600">Admin</span>
           </h1>
           <p className="text-slate-500 text-[10px] font-black mt-2 uppercase tracking-widest">
             {isSent 
               ? "Recovery link has been dispatched" 
               : "Enter your email to receive recovery link"}
           </p>
        </div>

        <div className="space-y-6">
           {!isSent ? (
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="relative space-y-1.5">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Email Address</label>
                 <div className="relative">
                   <input
                     type="email"
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="e.g. admin@mototrad.com"
                     className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium shadow-sm"
                   />
                   <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 </div>
               </div>

               <Button 
                 type="submit" 
                 variant="primary" 
                 className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-wider text-[11px] flex items-center justify-center gap-2"
                 isLoading={isLoading}
               >
                 <Send className="w-3.5 h-3.5" /> Send Recovery Link
               </Button>
             </form>
           ) : (
             <div className="space-y-6">
               <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-xs text-center font-bold">
                 ✉️ Recovery link successfully sent to <span className="underline">{email}</span>. Please check your inbox and spam folders.
               </div>
               <Button 
                 type="button" 
                 variant="outline" 
                 className="w-full border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-black py-4 rounded-xl transition-all uppercase tracking-wider text-[11px]"
                 onClick={() => setIsSent(false)}
               >
                 Try another email address
               </Button>
             </div>
           )}
           
           <div className="mt-8 text-center pt-6 border-t border-slate-100">
             <Link 
               href="/auth/login" 
               className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold uppercase tracking-widest text-[10px] transition-colors"
             >
               <ArrowLeft className="w-3 h-3" /> Back to Secure Login
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
