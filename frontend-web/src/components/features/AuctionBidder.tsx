'use client';

import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket.service';
import CommissionBreakdown from './CommissionBreakdown';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

interface AuctionBidderProps {
  auctionId: string;
  productId?: string;
  currentBid: number;
  bidIncrement?: number;
}

export default function AuctionBidder({ auctionId, productId, currentBid, bidIncrement = 100 }: AuctionBidderProps) {
  const [bidAmount, setBidAmount] = useState<string>((currentBid + bidIncrement).toString());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sync bid amount if current bid changes externally
    setBidAmount((currentBid + bidIncrement).toString());
  }, [currentBid, bidIncrement]);

  const handleBid = async () => {
    const amount = Number(bidAmount);
    if (!amount) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount <= currentBid) {
      toast.error(`Bid must be greater than current bid ($${currentBid.toLocaleString()})`);
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Your Bid',
      html: `
        <div class="text-center p-2">
          <p class="text-slate-500 font-medium mb-4">You are about to place a bid for</p>
          <p class="text-4xl font-black text-primary">$${amount.toLocaleString()}</p>
          <p class="text-xs text-slate-400 mt-4 uppercase tracking-widest font-bold">This action cannot be undone</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Place Bid',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl font-black px-8 py-3',
        cancelButton: 'rounded-xl font-black px-8 py-3'
      }
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    socketService.emit('place_bid', { auctionId, amount });
    
    // Use once to stop loading when response comes
    socketService.once('bid_placed', () => setLoading(false));
    socketService.once('bid_error', () => setLoading(false));

    // Safety timeout to prevent infinite loading
    setTimeout(() => {
        setLoading(false);
    }, 10000);
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
          <p className="text-[0.7rem] text-[#64748B] font-bold uppercase tracking-wider">
            Min. Next Bid: <span className="text-[#111] font-black">${(currentBid + bidIncrement).toLocaleString()}</span>
          </p>
       </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        <div className="relative flex-1 group">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-[#111] text-xl transition-colors group-focus-within:text-primary">$</span>
          <input 
              type="number" 
              className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl py-4 lg:py-5 pl-12 pr-6 text-xl font-black outline-none transition-all focus:bg-white focus:border-primary/20 shadow-sm" 
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={currentBid + bidIncrement} 
          />
        </div>
        <button 
          className="bg-primary text-white px-10 lg:px-12 py-4 lg:py-0 rounded-xl font-black text-[1rem] lg:text-[1.1rem] shadow-[0_8px_20px_rgba(211,47,47,0.2)] transition-all hover:bg-primary-hover hover:-translate-y-1 active:scale-95 disabled:opacity-50" 
          onClick={handleBid}
          disabled={loading}
        >
          {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Place Bid'}
        </button>
      </div>
      
      {productId && (
        <CommissionBreakdown productId={productId} amount={Number(bidAmount)} />
      )}
    </div>
  );
}
