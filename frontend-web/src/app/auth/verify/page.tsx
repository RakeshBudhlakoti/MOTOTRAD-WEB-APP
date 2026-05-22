'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/axios';

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiClient.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        // Automatically redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?verified=true');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-poppins">
      <div className="container flex flex-col items-center px-4">
        <div className="w-full max-w-[550px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9] text-center">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-[1.8rem] font-black text-[#111] uppercase tracking-tighter">Verifying Account</h2>
              <p className="text-[#64748B] font-medium leading-relaxed">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <i className="fas fa-check-circle text-green-500 text-4xl"></i>
              </div>
              <h2 className="text-[1.8rem] font-black text-[#111] uppercase tracking-tighter">Account Activated!</h2>
              <p className="text-[#64748B] font-medium leading-relaxed">{message}</p>
              <p className="text-[#94A3B8] text-[0.85rem]">Redirecting to login in 3 seconds...</p>
              <Link href="/auth/login" className="btn btn-primary w-full mt-4">Login Now</Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                <i className="fas fa-times-circle text-red-500 text-4xl"></i>
              </div>
              <h2 className="text-[1.8rem] font-black text-[#111] uppercase tracking-tighter">Verification Failed</h2>
              <p className="text-[#64748B] font-medium leading-relaxed">{message}</p>
              <div className="grid grid-cols-1 w-full gap-4 mt-4">
                <Link href="/auth/register" className="btn btn-primary w-full">Back to Register</Link>
                <Link href="/contact" className="text-primary font-bold text-[0.9rem] hover:underline">Contact Support</Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-poppins">
        <div className="container flex flex-col items-center px-4">
          <div className="w-full max-w-[550px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9] text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-[1.8rem] font-black text-[#111] uppercase tracking-tighter">Loading</h2>
              <p className="text-[#64748B] font-medium leading-relaxed">Loading verification...</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}

