'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/axios';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';

function LoginContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (searchParams.get('verified')) {
      Swal.fire({
        icon: 'success',
        title: '<span class="font-poppins font-bold uppercase">Email Verified!</span>',
        text: 'Your account has been activated successfully. You can now login.',
        confirmButtonColor: '#C90000',
        customClass: {
          popup: 'rounded-[25px] font-poppins',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-wider'
        }
      });
    }
    if (searchParams.get('registered')) {
      Swal.fire({
        icon: 'info',
        title: '<span class="font-poppins font-bold uppercase">Check Your Email</span>',
        text: 'Please check your inbox to activate your account before logging in.',
        confirmButtonColor: '#111',
        customClass: {
          popup: 'rounded-[25px] font-poppins',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-wider'
        }
      });
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/auth/login', formData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update Redux state
      dispatch(setCredentials({ user, token: access_token }));
      
      Swal.fire({
        icon: 'success',
        title: '<span class="font-poppins font-bold uppercase">Welcome Back!</span>',
        text: `Successfully logged in as ${user.firstName || user.email}`,
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-[25px] font-poppins',
        }
      });

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorData = err.response?.data?.message;
      const message = typeof errorData === 'object' ? errorData.message : errorData || 'Login failed. Please try again.';
      
      if (err.response?.status === 403) {
        Swal.fire({
          icon: 'warning',
          title: '<span class="font-poppins font-bold uppercase text-primary">Account Inactive</span>',
          html: `
            <div class="font-poppins flex flex-col gap-4">
              <p class="text-[#64748B] font-medium leading-relaxed">
                ${message}
              </p>
              <a href="/contact" class="text-primary font-bold hover:underline">Contact Admin for Support</a>
            </div>
          `,
          confirmButtonColor: '#C90000',
          confirmButtonText: 'CLOSE',
          customClass: {
            popup: 'rounded-[25px] p-10',
            confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-wider'
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '<span class="font-poppins font-bold uppercase">Authentication Error</span>',
          text: message,
          confirmButtonColor: '#111',
          customClass: {
            popup: 'rounded-[25px]',
            confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase'
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-poppins">
      <div className="container flex flex-col items-center px-4">
        {/* Toggle Header */}
        <div className="flex items-center bg-white border border-[#E2E8F0] rounded-full p-1.5 mb-12 shadow-sm">
            <Link href="/auth/register" className="px-10 lg:px-14 py-3 rounded-full font-black text-[#64748B] hover:bg-[#F8FAFC] text-[0.85rem] uppercase tracking-wider transition-all">Register</Link>
            <Link href="/auth/login" className="px-10 lg:px-14 py-3 rounded-full font-black bg-[#111] text-white shadow-xl text-[0.85rem] uppercase tracking-wider transition-all">Login</Link>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[650px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            <h2 className="text-[2.5rem] font-black text-[#111] text-center mb-12 tracking-tighter uppercase">Login Your Account</h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Email Address <span className="text-primary">*</span></label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email" 
                        className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-5 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.95rem]" 
                    />
                </div>

                <div className="flex flex-col gap-3 relative">
                    <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Password <span className="text-primary">*</span></label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter password" 
                            className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-5 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.95rem] pr-16" 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-primary transition-colors"
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                        </button>
                    </div>
                </div>

                <Link href="/auth/forgot-password" className="text-[#64748B] font-bold hover:text-primary transition-colors self-start underline-offset-4 hover:underline text-[0.85rem]">
                    Forgotten Password?
                </Link>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white w-full py-5 rounded-xl text-lg font-black shadow-[0_10px_30px_rgba(201,0,0,0.2)] hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : 'Sign In'}
                </button>
            </form>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
