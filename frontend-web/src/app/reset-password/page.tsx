'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      toast.error('Missing or invalid reset token. Redirecting...');
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [token, router]);

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (val.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (val !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return toast.error('Reset token is missing');
    }

    if (!password) {
      return toast.error('Please enter a new password');
    }

    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setIsSuccess(true);
      
      Swal.fire({
        icon: 'success',
        title: '<span class="font-poppins font-bold uppercase text-slate-800">Password Reset!</span>',
        text: 'Your password has been updated successfully. You can now login with your new password.',
        confirmButtonColor: '#C90000',
        confirmButtonText: 'LOG IN NOW',
        customClass: {
          popup: 'rounded-[25px] font-poppins',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-wider'
        }
      }).then(() => {
        router.push('/auth/login');
      });
    } catch (err: any) {
      console.error('Password reset failed:', err);
      const errorData = err.response?.data?.message;
      const message = typeof errorData === 'object' ? errorData.message : errorData || 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center font-poppins">
        <div className="container flex flex-col items-center px-4">
          <div className="w-full max-w-[700px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9] text-center">
            <div className="text-red-500 text-5xl mb-6">⚠️</div>
            <h2 className="text-[2.2rem] font-black text-[#111] uppercase tracking-tighter mb-4">Invalid Reset Link</h2>
            <p className="text-[#64748B] font-bold text-[1.1rem] leading-relaxed mb-8">
              The reset token is missing from the link. If you need to reset your password, please request a new recovery link.
            </p>
            <Link 
              href="/auth/forgot-password" 
              className="bg-primary text-white px-10 py-4 rounded-xl text-md font-black hover:bg-primary-hover shadow-lg transition-all uppercase tracking-wider no-underline inline-block"
            >
              Request Reset Link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-poppins">
      <div className="container flex flex-col items-center px-4">
        {/* Top Pill - Site Design */}
        <div className="bg-[#111] text-white px-14 py-4 rounded-full font-black text-lg shadow-2xl mb-12 uppercase tracking-widest scale-105">
            Reset Password
        </div>

        {/* Reset Password Card - High-Fidelity Site Design */}
        <div className="w-full max-w-[700px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            <h2 className="text-[2.6rem] font-black text-[#111] text-center mb-10 tracking-tighter uppercase">Create New Password</h2>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Password Input */}
                <div className="flex flex-col gap-3 relative">
                    <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">New Password <span className="text-primary">*</span></label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            required
                            placeholder="Enter new password" 
                            className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-16 ${
                              errors.password ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-primary/20'
                            }`} 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-primary transition-colors"
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                        </button>
                    </div>
                    {errors.password && (
                      <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">
                        {errors.password}
                      </span>
                    )}
                </div>

                {/* Confirm Password Input */}
                <div className="flex flex-col gap-3 relative">
                    <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Confirm New Password <span className="text-primary">*</span></label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            value={confirmPassword}
                            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                            required
                            placeholder="Repeat new password" 
                            className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-16 ${
                              errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-primary/20'
                            }`} 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-primary transition-colors"
                        >
                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                        </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">
                        {errors.confirmPassword}
                      </span>
                    )}
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || !!errors.password || !!errors.confirmPassword}
                  className="bg-primary text-white w-full py-5 rounded-xl text-lg font-black shadow-[0_10px_30px_rgba(201,0,0,0.2)] hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-[0.98] mt-6 uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating Password...</span>
                      </div>
                    ) : 'Update Password'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-8 text-center animate-fade-in">
                 <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl text-md font-bold leading-relaxed">
                   🎉 Your password has been successfully updated!
                 </div>
                 
                 <p className="text-[#64748B] font-bold text-[0.95rem] leading-relaxed">
                   You may now proceed to log in with your credentials.
                 </p>

                 <Link 
                   href="/auth/login" 
                   className="bg-[#111] text-white py-4 rounded-xl text-md font-black hover:-translate-y-0.5 transition-all uppercase tracking-wider text-center no-underline flex items-center justify-center"
                 >
                   Go to Login
                 </Link>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
