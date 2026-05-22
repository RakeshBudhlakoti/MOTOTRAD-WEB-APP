'use client';

import { useState } from 'react';
import { paymentService } from '@/services/payment.service';
import { CreditCard, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  order: any;
  onSuccess: () => void;
}

export default function CheckoutModal({ order, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { paymentUrl } = await paymentService.initiatePayment(order.id, paymentType);
      // In a real app, redirect to PayPal
      window.location.href = paymentUrl;
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[32px] p-8 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black font-outfit">Secure Checkout</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Order #{order.orderNumber.slice(-8)}</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={() => setPaymentType('DEPOSIT')}
          className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
            paymentType === 'DEPOSIT' 
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold">Pay Security Deposit</span>
            <span className="text-blue-600 font-black">$500.00</span>
          </div>
          <p className="text-xs text-slate-500">Secure the item immediately. Pay balance within 48h.</p>
        </button>

        <button
          onClick={() => setPaymentType('FULL')}
          className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
            paymentType === 'FULL' 
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold">Pay Full Amount</span>
            <span className="text-blue-600 font-black">${Number(order.totalAmount).toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-500">Complete transaction now. Includes fees & taxes.</p>
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-8 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Order Total</span>
          <span className="font-bold">${Number(order.totalAmount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Service Fee (5%)</span>
          <span className="font-bold">${Number(order.feeAmount).toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <>
            Pay with PayPal <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <ShieldCheck className="h-4 w-4" />
        Encrypted & Secure Transaction
      </div>
    </div>
  );
}
