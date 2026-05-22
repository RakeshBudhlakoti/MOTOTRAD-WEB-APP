'use client';

import { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { orderService } from '@/services/order.service';
import { toast } from 'react-hot-toast';
import CommissionBreakdown from './CommissionBreakdown';

interface WinnerCheckoutProps {
  order: any;
  onSuccess: () => void;
}

export default function WinnerCheckout({ order, onSuccess }: WinnerCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    try {
      const { paypalOrderId } = await orderService.initiateDepositPayment(order.id);
      return paypalOrderId;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      throw error;
    }
  };

  const handleApprove = async (data: any) => {
    setLoading(true);
    try {
      await orderService.captureDepositPayment(order.id, data.orderID);
      toast.success('Deposit paid successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to capture payment');
    } finally {
      setLoading(false);
    }
  };

  const depositPayment = order.payments?.find((p: any) => p.paymentType === 'DEPOSIT');
  const totalAmountVal = Number(order.totalAmount);
  const depositAmountVal = Number(depositPayment?.amount || 0);
  const depositPct = totalAmountVal > 0 ? Math.round((depositAmountVal / totalAmountVal) * 100) : 10;
  const isPaid = depositPayment?.status === 'COMPLETED' || order.status === 'DEPOSIT_PAID' || order.status === 'FULLY_PAID';

  if (isPaid) {
    return (
      <div className="bg-green-50 border border-green-100 p-8 rounded-2xl text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-2xl text-green-600"></i>
        </div>
        <h3 className="text-xl font-black text-[#111] mb-2 uppercase">Deposit Paid</h3>
        <p className="text-[#64748B] font-bold">Your purchase is secured. Our team will contact you for the remaining balance and delivery.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-primary/10 shadow-xl animate-scale-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <i className="fas fa-shopping-cart text-primary"></i>
        </div>
        <div>
          <h3 className="text-xl font-black text-[#111] uppercase tracking-tight">Complete Your Purchase</h3>
          <p className="text-[0.8rem] text-[#64748B] font-bold uppercase tracking-wider">Order #{order.orderNumber}</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center py-3 border-b border-slate-100">
          <span className="text-[#64748B] font-bold">Winning Bid</span>
          <span className="text-[#111] font-black">${Number(order.baseAmount).toLocaleString()}</span>
        </div>
        
        <CommissionBreakdown 
          productId={order.auction.productId} 
          amount={Number(order.baseAmount)} 
          showByDefaultForce={true}
        />

        <div className="flex justify-between items-center py-4 bg-[#F8FAFC] px-4 rounded-xl">
          <span className="text-[#111] font-bold uppercase text-[0.8rem]">Total Amount</span>
          <span className="text-primary font-black text-[1.4rem]">${Number(order.totalAmount).toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center py-4 bg-primary/5 px-4 rounded-xl border border-primary/10">
          <div className="flex flex-col">
            <span className="text-primary font-black uppercase text-[0.8rem]">Deposit Due Now ({depositPct}%)</span>
            <span className="text-[0.7rem] text-[#64748B] font-bold italic">Secure this item immediately</span>
          </div>
          <span className="text-primary font-black text-[1.4rem]">${Number(depositPayment?.amount).toLocaleString()}</span>
        </div>
      </div>

      <div className="relative z-10">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <PayPalButtons 
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
        />
      </div>
      
      <p className="text-center text-[0.7rem] text-[#94A3B8] font-bold mt-6 uppercase tracking-widest">
        <i className="fas fa-lock mr-2"></i> Secure Encrypted Checkout
      </p>
    </div>
  );
}
