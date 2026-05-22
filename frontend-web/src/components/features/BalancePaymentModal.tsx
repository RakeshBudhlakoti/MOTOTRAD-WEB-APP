'use client';

import { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { orderService } from '@/services/order.service';
import { getErrorMessage } from '@/utils/error';
import toast from 'react-hot-toast';
import { X, CreditCard, ShieldCheck, Wallet } from 'lucide-react';

interface BalancePaymentModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BalancePaymentModal({ order, onClose, onSuccess }: BalancePaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = Number(order.totalAmount);
  const paidAmount = order.payments
    ?.filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  
  const remainingAmount = totalAmount - paidAmount;

  const depositPayment = order.payments?.find((p: any) => p.paymentType === 'DEPOSIT');
  const isDepositPaid = depositPayment?.status === 'COMPLETED' || order.status === 'DEPOSIT_PAID' || order.status === 'FULLY_PAID';

  const [paymentOption, setPaymentOption] = useState<'DEPOSIT' | 'FULL'>(isDepositPaid ? 'FULL' : 'DEPOSIT');

  const activeAmount = paymentOption === 'DEPOSIT' ? Number(depositPayment?.amount || 0) : remainingAmount;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in border border-slate-100">
        {/* Header */}
        <div className="relative p-8 pb-4">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Pay Order</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                {isDepositPaid ? 'Finalize your purchase' : 'Select payment option'}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Payment Option Selector */}
        {!isDepositPaid && (
          <div className="px-8 mb-6 space-y-3">
            <span className="text-[0.65rem] text-slate-400 font-black uppercase tracking-[2px] block">Select Payment Plan</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentOption('DEPOSIT')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-28 ${
                  paymentOption === 'DEPOSIT' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-white'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs block uppercase tracking-wider mb-1">Pay Deposit</span>
                  <span className="text-[0.65rem] text-slate-500 font-medium leading-tight block">Secure item immediately.</span>
                </div>
                <span className="font-black text-lg block leading-none mt-2">
                  ${Number(depositPayment?.amount || 0).toLocaleString()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption('FULL')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-28 ${
                  paymentOption === 'FULL' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-white'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs block uppercase tracking-wider mb-1">Pay In Full</span>
                  <span className="text-[0.65rem] text-slate-500 font-medium leading-tight block">Complete transaction now.</span>
                </div>
                <span className="font-black text-lg block leading-none mt-2">
                  ${remainingAmount.toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="px-8 mb-8">
          <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 space-y-4">
             <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                <span>Base Price</span>
                <span>${Number(order.baseAmount).toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold text-primary uppercase tracking-wider">
                <span>Platform Commission ({order.commissionType === 'PERCENTAGE' ? `${Number(order.commissionRate)}%` : 'Flat'}) (+)</span>
                <span>${Number(order.commissionAmount).toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold text-slate-900 uppercase tracking-wider bg-slate-100/50 px-3 py-2 rounded-lg">
                <span>Total Amount</span>
                <span>${totalAmount.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold text-green-600 uppercase tracking-wider px-3">
                <span>Already Paid</span>
                <span>-${paidAmount.toLocaleString()}</span>
             </div>
             <div className="h-px bg-slate-200"></div>
             <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 uppercase tracking-tight">
                  {paymentOption === 'DEPOSIT' ? 'Deposit Amount Due' : 'Remaining Balance'}
                </span>
                <span className="font-black text-2xl text-primary">${activeAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* PayPal Section */}
        <div className="px-8 pb-8">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-black uppercase tracking-widest text-primary animate-pulse">Processing Payment...</p>
            </div>
          ) : (
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", label: "pay", color: "gold" }}
              createOrder={async () => {
                try {
                  console.log('[BalancePaymentModal] Current Order Status:', order.status);
                  console.log(`[BalancePaymentModal] Calling initiate for payment option: ${paymentOption}, order:`, order.id);
                  
                  const result = paymentOption === 'DEPOSIT'
                    ? await orderService.initiateDepositPayment(order.id)
                    : await orderService.initiateBalancePayment(order.id);
                  
                  console.log('[BalancePaymentModal] Backend Result:', result);
                  if (!result || !result.paypalOrderId) {
                    const msg = 'Failed to get PayPal Order ID from server';
                    console.error('[BalancePaymentModal]', msg, result);
                    toast.error(msg);
                    throw new Error(msg);
                  }
                  return result.paypalOrderId;
                } catch (err: any) {
                  const errorMessage = getErrorMessage(err);
                  console.error('[BalancePaymentModal] Payment Initiation Error:', errorMessage, err);
                  toast.error(errorMessage || 'Failed to initiate payment');
                  throw err;
                }
              }}
              onApprove={async (data) => {
                setIsProcessing(true);
                try {
                  if (paymentOption === 'DEPOSIT') {
                    await orderService.captureDepositPayment(order.id, data.orderID);
                    toast.success('Success! Deposit payment completed successfully.');
                  } else {
                    await orderService.captureBalancePayment(order.id, data.orderID);
                    toast.success('Success! Payment completed successfully.');
                  }
                  onSuccess();
                } catch (err: any) {
                  toast.error(getErrorMessage(err) || 'Payment verification failed');
                } finally {
                  setIsProcessing(false);
                }
              }}
              onError={(err) => {
                toast.error('PayPal failed to load. Please try again.');
                console.error('PayPal Error:', err);
              }}
            />
          )}
          
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-green-500" />
            Mototrad Secured Transaction
          </div>
        </div>
      </div>
    </div>
  );
}
