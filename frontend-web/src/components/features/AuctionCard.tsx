'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import CountdownTimer from '../common/CountdownTimer';

interface AuctionCardProps {
  auction: any;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentBid = auction.type === 'BUY_NOW_ONLY' 
    ? (Number(auction.buyItNowPrice || auction.buyNowPrice || 0))
    : ((Number(auction.currentBid) > 0) ? auction.currentBid : auction.startingBid);
  const mainImage = auction.product?.media?.find((m: any) => m.isPrimary)?.url || 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800';

    const isEnded = auction.status === 'ENDED_SOLD' || auction.status === 'ENDED_UNSOLD' || auction.status === 'COMPLETED' || auction.status === 'EXPIRED';
    const isSold = auction.status === 'ENDED_SOLD' || auction.status === 'COMPLETED' || auction.product?.isSoldOut;

    return (
      <div className="bg-white rounded-[15px] p-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] transition-all duration-400 hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] border border-[#F1F5F9]">
        <div className="relative w-full h-[240px] rounded-[12px] overflow-hidden mb-5">
          <img 
            src={mainImage} 
            alt={auction.product?.title} 
            className={`w-full h-full object-cover ${isEnded ? 'grayscale-[0.4] opacity-80' : ''}`}
            onError={(e: any) => { e.target.src = 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            <div className={`${isSold ? 'bg-green-600' : (isEnded ? 'bg-[#64748B]' : 'bg-[#C90000]')} text-white px-3.5 py-1.5 rounded-full font-bold text-[0.7rem] flex items-center gap-2 shadow-md uppercase tracking-wider w-fit`}>
              <i className={`fas ${isSold ? 'fa-check-circle' : (isEnded ? 'fa-clock' : 'fa-gavel')} text-[10px]`}></i> 
              {isSold ? 'Sold' : (isEnded ? 'Ended' : 'Live')}
            </div>
            {auction.product?.isFeatured && (
              <div className="bg-gradient-to-r from-[#D4AF37] via-[#F39C12] to-[#D4AF37] text-white px-3.5 py-1.5 rounded-full font-black text-[0.7rem] flex items-center gap-1.5 shadow-md uppercase tracking-wider w-fit border border-[#F39C12]/30 animate-pulse">
                <i className="fas fa-star text-[9px]"></i>
                Featured
              </div>
            )}
          </div>
          
          {/* Only show timer if NOT ended */}
          {!isEnded && <CountdownTimer endTime={auction.endTime} variant="compact" />}

          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
        </div>
  
        <div className="px-1.5 pb-2">
          <h3 className="text-[1rem] font-bold text-[#111] leading-[1.5] mb-6 min-h-[3em] line-clamp-2 tracking-tight">
            {auction.product?.title}
          </h3>
          
          <div className="flex items-end justify-between gap-4 mt-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] text-[#888] font-semibold uppercase tracking-wider">
                {isSold ? 'Final Price' : (isEnded ? 'Last Bid' : 'Current Price')}
              </span>
              <span className={`text-[1.3rem] font-extrabold ${isSold ? 'text-green-600' : 'text-[#111]'} leading-none tracking-tighter`}>
                ${Number(currentBid).toLocaleString()}
              </span>
              
              {/* Winner Name for Past Auctions */}
              {isEnded && auction.highestBidder && (
                <span className="text-[0.65rem] text-primary font-bold mt-1 animate-fade-in">
                  <i className="fas fa-trophy mr-1"></i>
                  Won by {auction.highestBidder.username || 'Anonymous User'}
                </span>
              )}
              {isEnded && !auction.highestBidder && isSold && (
                <span className="text-[0.65rem] text-green-600 font-bold mt-1">
                  <i className="fas fa-check-circle mr-1"></i>
                  Direct Purchase
                </span>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Link 
                href={`/auctions/${auction.id}`} 
                className={`${isEnded ? 'bg-[#64748B]' : 'bg-[#111]'} text-white rounded-lg px-6 py-3 font-bold text-[0.8rem] no-underline transition-all duration-300 hover:bg-[#333] hover:scale-105 active:scale-95 shadow-sm uppercase tracking-wider block text-center`}
              >
                {isEnded ? (auction.type === 'BUY_NOW_ONLY' ? 'Sold Out' : 'View Result') : (
                  auction.product?.buyNowDisabled ? (
                    auction.type === 'BUY_NOW_ONLY' ? 'Bidding Active' : 'Bid Now'
                  ) : (
                    auction.type === 'BUY_NOW_ONLY' ? 'Buy Now' : 
                    auction.type === 'BID_AND_BUY' ? 'Bid & Buy' : 'Bid Now'
                  )
                )}
              </Link>
              {!isEnded && !user?.isProMember && (
                <Link href="/membership" className="text-[0.6rem] text-primary font-black uppercase tracking-tighter hover:underline">
                  Upgrade to Bid <i className="fas fa-arrow-right ml-1"></i>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
}
