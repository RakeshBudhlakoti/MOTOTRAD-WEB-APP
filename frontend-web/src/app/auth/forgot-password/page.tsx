'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in">
      <div className="container flex flex-col items-center px-4">
        {/* Top Pill - Site Design */}
        <div className="bg-[#111] text-white px-14 py-4 rounded-full font-black text-lg shadow-2xl mb-12 uppercase tracking-widest scale-105">
            Reset Password
        </div>

        {/* Forgot Password Card - High-Fidelity Site Design */}
        <div className="w-full max-w-[700px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            <h2 className="text-[2.8rem] font-black text-[#111] text-center mb-6 tracking-tighter uppercase">Forget Password?</h2>

            <form className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <label className="text-[0.75rem] font-black text-[#111] uppercase tracking-[2px]">Your Email Address <span className="text-primary">*</span></label>
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-5 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-lg text-[#111]" 
                    />
                    <p className="text-[#64748B] font-bold text-[0.95rem] leading-relaxed">
                        We'll send a <span className="text-primary">verification code</span> to this email if it matches an existing account.
                    </p>
                </div>

                <Link href="/auth/login" className="text-[#64748B] font-black hover:text-primary transition-colors self-start border-b-2 border-[#CBD5E1] pb-1 uppercase text-[0.85rem] tracking-wider">
                    Return to Login
                </Link>

                <button className="bg-primary text-white w-full py-5 rounded-xl text-xl font-black shadow-[0_10px_30px_rgba(201,0,0,0.2)] hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest">
                    Continue
                </button>
            </form>
        </div>
      </div>
    </main>
  );
}
