'use client';

import { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { orderService } from '@/services/order.service';
import { getErrorMessage } from '@/utils/error';
import toast from 'react-hot-toast';
import { X, CreditCard, ShieldCheck, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';

import { commissionService } from '@/services/commission.service';
import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

interface BuyNowModalProps {
  auction: any;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function BuyNowModal({ auction, onClose, onSuccess }: BuyNowModalProps) {
  const { getSetting } = useSettings();
  const [isPartial, setIsPartial] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [loadingCommission, setLoadingCommission] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const buyItNowPrice = Number(auction.buyItNowPrice);

  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const data = await commissionService.calculate(auction.productId, buyItNowPrice);
        setCommissionData(data);
      } catch (err) {
        console.error('Failed to load commission info', err);
      } finally {
        setLoadingCommission(false);
      }
    };
    fetchCommission();
  }, [auction.productId, buyItNowPrice]);

  const totalAmount = commissionData ? commissionData.finalAmount : buyItNowPrice;
  
  const product = auction.product || {};
  let minPercent = 20;
  if (!product.useGlobalUpfrontPayment && product.upfrontPaymentPercentage !== null && product.upfrontPaymentPercentage !== undefined) {
    minPercent = Number(product.upfrontPaymentPercentage);
  } else {
    const globalVal = getSetting('upfront_payment_percentage');
    if (globalVal !== null && globalVal !== undefined) {
      minPercent = Number(globalVal);
    }
  }
  
  const partialAmount = (totalAmount * minPercent) / 100;

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
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Buy It Now</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Secure this item instantly</p>
            </div>
          </div>
        </div>

        {/* Product Summary */}
        <div className="px-8 mb-6 relative">
          {loadingCommission && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-2xl">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="bg-slate-50 rounded-2xl p-6 flex flex-col gap-4 border border-slate-100">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                   <img src={auction.product?.media?.[0]?.url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{auction.product?.title}</h3>
                   <p className="text-slate-500 text-xs font-semibold">Buy It Now Option</p>
                </div>
             </div>
             
             <div className="space-y-2 pt-4 border-t border-slate-200/60">
                <div 
                  className="flex justify-between items-center cursor-pointer group"
                  onClick={() => setIsOpen(!isOpen)}
                >
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-black uppercase tracking-tight text-slate-900">Total Payable</span>
                     <Info size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                   </div>
                   <div className="flex items-center gap-1">
                     <span className="text-sm font-black text-slate-900">${totalAmount.toLocaleString()}</span>
                     {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                   </div>
                </div>

                {isOpen && (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                       <span>Base Price</span>
                       <span>${buyItNowPrice.toLocaleString()}</span>
                    </div>
                    {commissionData && commissionData.commissionAmount > 0 && (
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-primary">
                         <span>Buyer Commission</span>
                         <span>+ ${commissionData.commissionAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className={`px-8 space-y-4 mb-8 ${loadingCommission ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            onClick={() => setIsPartial(false)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              !isPartial 
                ? 'border-primary bg-primary/5' 
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm uppercase tracking-wide">Full Payment</span>
              <span className="font-black text-lg">${totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium italic">Immediate ownership transfer after payment</p>
          </button>

          <button
            onClick={() => setIsPartial(true)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              isPartial 
                ? 'border-primary bg-primary/5' 
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm uppercase tracking-wide">Partial Deposit ({minPercent}%)</span>
              <span className="font-black text-lg">${partialAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium italic">Pay remaining ${ (totalAmount - partialAmount).toLocaleString() } within 48 hours</p>
          </button>
        </div>

        {/* PayPal Section */}
        <div className={`px-8 pb-8 ${loadingCommission ? 'hidden' : ''}`}>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-black uppercase tracking-widest text-primary animate-pulse">Finalizing Purchase...</p>
            </div>
          ) : (
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", label: "buynow", color: "blue" }}
              createOrder={async () => {
                try {
                  console.log('[BuyNowModal] Initiating order for auction:', auction.id, 'partial:', isPartial);
                  const result = await orderService.createBuyNowOrder(auction.id, isPartial);
                  console.log('[BuyNowModal] Order initiated:', result);
                  if (!result.paypalOrderId) {
                    console.error('[BuyNowModal] Missing paypalOrderId in response');
                  }
                  return result.paypalOrderId;
                } catch (err: any) {
                  console.error('[BuyNowModal] Failed to initiate checkout:', err);
                  const errorMessage = getErrorMessage(err);
                  toast.error(errorMessage || 'Failed to initiate checkout');
                  return "";
                }
              }}
              onApprove={async (data) => {
                setIsProcessing(true);
                try {
                  const result = await orderService.captureBuyNowPayment(data.orderID);
                  toast.success('Success! The item is yours.');
                  onSuccess(result.orderId);
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
