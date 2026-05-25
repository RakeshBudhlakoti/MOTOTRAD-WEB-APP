'use client';

import { useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please enter your email address');
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSent(true);
      toast.success('If the account exists, a reset link has been sent.');
    } catch (err: any) {
      console.error('Forgot password failed:', err);
      const errorData = err.response?.data?.message;
      const message = typeof errorData === 'object' ? errorData.message : errorData || 'Failed to request password reset';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-poppins">
      <div className="container flex flex-col items-center px-4">
        {/* Top Pill - Site Design */}
        <div className="bg-[#111] text-white px-14 py-4 rounded-full font-black text-lg shadow-2xl mb-12 uppercase tracking-widest scale-105">
            Reset Password
        </div>

        {/* Forgot Password Card - High-Fidelity Site Design */}
        <div className="w-full max-w-[700px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            <h2 className="text-[2.8rem] font-black text-[#111] text-center mb-6 tracking-tighter uppercase">Forget Password?</h2>

            {!isSent ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                      <label className="text-[0.75rem] font-black text-[#111] uppercase tracking-[2px]">Your Email Address <span className="text-primary">*</span></label>
                      <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email" 
                          className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-5 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-lg text-[#111]" 
                      />
                      <p className="text-[#64748B] font-bold text-[0.95rem] leading-relaxed">
                          We'll send a <span className="text-primary">password reset link</span> to this email if it matches an active account.
                      </p>
                  </div>

                  <Link href="/auth/login" className="text-[#64748B] font-black hover:text-primary transition-colors self-start border-b-2 border-[#CBD5E1] pb-1 uppercase text-[0.85rem] tracking-wider no-underline">
                      Return to Login
                  </Link>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-white w-full py-5 rounded-xl text-xl font-black shadow-[0_10px_30px_rgba(201,0,0,0.2)] hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
                  >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : 'Continue'}
                  </button>
              </form>
            ) : (
              <div className="flex flex-col gap-8 text-center">
                 <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl text-md font-bold leading-relaxed">
                   ✉️ An email has been sent. If an account is registered with <span className="underline">{email}</span> and is active, you will find a link to reset your password.
                 </div>
                 
                 <p className="text-[#64748B] font-bold text-[0.95rem] leading-relaxed">
                   Please inspect your inbox and spam folder. The recovery link will expire in 30 minutes.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 mt-4">
                   <button 
                     onClick={() => setIsSent(false)}
                     className="border-2 border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 py-4 rounded-xl text-md font-black transition-all uppercase tracking-wider"
                   >
                     Try another email
                   </button>
                   
                   <Link 
                     href="/auth/login" 
                     className="bg-[#111] text-white flex-1 py-4 rounded-xl text-md font-black hover:-translate-y-0.5 transition-all uppercase tracking-wider text-center no-underline flex items-center justify-center"
                   >
                     Back to Login
                   </Link>
                 </div>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}
