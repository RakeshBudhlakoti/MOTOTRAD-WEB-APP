'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket.service';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setLiveBid } from '@/store/slices/auctionSlice';
import AuctionBidder from '@/components/features/AuctionBidder';
import { useAppQuery } from '@/hooks/useApp';
import { auctionService } from '@/services/auction.service';
import { orderService } from '@/services/order.service';
import Link from 'next/link';
import CountdownTimer from '@/components/common/CountdownTimer';
import BuyNowModal from '@/components/features/BuyNowModal';
import CommissionBreakdown from '@/components/features/CommissionBreakdown';
import WinnerCheckout from '@/components/features/WinnerCheckout';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const auctionId = id as string;
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const liveBids = useSelector((state: RootState) => state.auctions.liveBids[auctionId]) || [];
  const [onlineBidders, setOnlineBidders] = useState(1);
  const [membershipFee, setMembershipFee] = useState<number>(5);
  const [allowBuyNowAfterBids, setAllowBuyNowAfterBids] = useState<boolean>(false);
  const [proBiddersCount, setProBiddersCount] = useState<number>(2400);
  const [proBiddersAvatars, setProBiddersAvatars] = useState<Array<{avatar: string | null, initial: string}>>([
    { avatar: null, initial: 'A' },
    { avatar: null, initial: 'B' },
    { avatar: null, initial: 'C' }
  ]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { settingsService } = await import('@/services/settings.service');
        const settings = await settingsService.getPublic();
        if (settings) {
          if (settings.membership_fee) {
            setMembershipFee(Number(settings.membership_fee));
          }
          if (settings.ALLOW_BUY_NOW_AFTER_BIDS !== undefined) {
            setAllowBuyNowAfterBids(settings.ALLOW_BUY_NOW_AFTER_BIDS === true || settings.ALLOW_BUY_NOW_AFTER_BIDS === 'true');
          }
          if (settings.pro_bidders_count !== undefined) {
            setProBiddersCount(Number(settings.pro_bidders_count));
          }
          if (settings.pro_bidders_avatars !== undefined && Array.isArray(settings.pro_bidders_avatars)) {
            setProBiddersAvatars(settings.pro_bidders_avatars);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);
  
  const { data: auctionData, isLoading } = useAppQuery(['auction', auctionId], () => 
    auctionService.findOne(auctionId)
  );

  useEffect(() => {
    socketService.emit('join_auction', { auctionId });
    
    const handleSync = (data: any) => {
      if (data.onlineBidders) setOnlineBidders(data.onlineBidders);
    };

    const handleBiddersCount = (data: any) => {
      if (data.auctionId === auctionId) {
        setOnlineBidders(data.count);
      }
    };

    const handleBidPlaced = (data: any) => {
       // Only for this auction
       dispatch(setLiveBid({ 
         auctionId, 
         bid: {
           amount: data.amount,
           user: { firstName: data.userName.split(' ')[0], lastName: data.userName.split(' ')[1] || '' },
           createdAt: data.timestamp,
           status: 'VALID'
         } 
       }));
       
       if (data.extended && data.newEndTime) {
           // Update the query cache immediately so the countdown reflects the extension
           queryClient.setQueryData(['auction', auctionId], (oldData: any) => {
             if (!oldData) return oldData;
             return {
               ...oldData,
               endTime: data.newEndTime,
               extensionCount: (oldData.extensionCount || 0) + 1
             };
           });
           
           toast.success('Auction extended by 10 seconds!', { icon: '⏰' });
        }
    };

    const handleHighestBidUpdated = (data: any) => {
        if (data.auctionId === auctionId) {
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        }
    };

    const handleAuctionEnded = (data: any) => {
        if (data.auctionId === auctionId) {
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
            toast.success('Auction has ended!', { icon: '🏁' });
        }
    };

    const handleBidError = (data: any) => {
        toast.error(data.message || 'Failed to place bid');
        if (data.code === 'AUCTION_EXPIRED') {
            queryClient.setQueryData(['auction', auctionId], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                status: (oldData.bidCount > 0 || liveBids.length > 0) ? 'COMPLETED' : 'EXPIRED'
              };
            });
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        }
    };

    const handleBuyNowDisabled = (data: any) => {
        if (data.auctionId === auctionId) {
            queryClient.setQueryData(['auction', auctionId], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                product: oldData.product ? {
                  ...oldData.product,
                  buyNowDisabled: true,
                  buyNowDisabledReason: 'ACTIVE_BIDDING'
                } : undefined
              };
            });
            toast.error('Buy Now has been disabled due to active bidding!', { icon: '🚫' });
        }
    };

    socketService.on('auction_sync', handleSync);
    socketService.on('online_bidders_count', handleBiddersCount);
    socketService.on('bid_placed', handleBidPlaced);
    socketService.on('highest_bid_updated', handleHighestBidUpdated);
    socketService.on('auction_ended', handleAuctionEnded);
    socketService.on('bid_error', handleBidError);
    socketService.on('buy_now_disabled', handleBuyNowDisabled);

    return () => {
      socketService.emit('leave_auction', { auctionId });
      socketService.off('auction_sync', handleSync);
      socketService.off('online_bidders_count', handleBiddersCount);
      socketService.off('bid_placed', handleBidPlaced);
      socketService.off('highest_bid_updated', handleHighestBidUpdated);
      socketService.off('auction_ended', handleAuctionEnded);
      socketService.off('bid_error', handleBidError);
      socketService.off('buy_now_disabled', handleBuyNowDisabled);
    };
  }, [auctionId]);

  // Handle auth changes for socket
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) socketService.reconnectWithToken(token);
    }
  }, [isAuthenticated]);

  const { data: orderData } = useAppQuery(['order-auction', auctionId], () => 
    orderService.findByAuctionId(auctionId),
    { enabled: isAuthenticated && !!auctionData && ((auctionData as any).status === 'ENDED_SOLD' || (auctionData as any).status === 'ENDED_UNSOLD' || (auctionData as any).status === 'COMPLETED') }
  );

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const auction = (auctionData as any) || {
    product: {
        title: 'Real Estate Item #10',
        description: 'This is a premium Real Estate listed exclusively on Mototrad. Experience the highest level of craftsmanship and heritage.',
        category: { name: 'Real Estate', slug: 'real-estate' },
        media: []
    },
    bidCount: 7,
    currentBid: 15000,
    startingBid: 10000
  };
  
  const currentBid = liveBids[0]?.amount || (auction.type === 'BUY_NOW_ONLY' ? Number(auction.buyItNowPrice || auction.buyNowPrice || 0) : (Number(auction.currentBid) > 0 ? Number(auction.currentBid) : Number(auction.startingBid)));
  const media = auction.product?.media || [];
  const buyNowPrice = Number(auction.buyItNowPrice || auction.buyNowPrice || currentBid * 1.2);
  const isBuyNowDisabled = !allowBuyNowAfterBids && (auction.product?.buyNowDisabled || Number(auction.bidCount) > 0);

  const isEnded = auction.status === 'ENDED_SOLD' || auction.status === 'ENDED_UNSOLD' || auction.status === 'COMPLETED' || auction.status === 'EXPIRED';
  const isSold = auction.status === 'ENDED_SOLD' || auction.status === 'COMPLETED' || auction.product?.isSoldOut;

  const isWinner = isAuthenticated && user?.id === auction.highestBidderId;
  const hasOrder = !!orderData;

  // Merge historical bids with live ones
  const historicalBids = auction.bids || [];
  
  // Start with rich historical bids (which have complete database records, user details, and avatars)
  const mergedBids = [...historicalBids];
  
  // Add live bids ONLY if they haven't been saved/synced into historicalBids yet
  liveBids.forEach((lBid: any) => {
    const isAlreadySynced = mergedBids.some(
      (hBid: any) => hBid.id === lBid.id || Number(hBid.amount) === Number(lBid.amount)
    );
    
    if (!isAlreadySynced) {
      // Construct a compatible shape for the UI to prevent "Anonymous User" flashes
      const fallbackUsername = lBid.user?.username || 
        `${lBid.user?.firstName || ''} ${lBid.user?.lastName || ''}`.trim() || 
        'Anonymous User';
        
      mergedBids.push({
        ...lBid,
        user: {
          username: fallbackUsername,
          avatar: lBid.user?.avatar || null,
        }
      });
    }
  });

  // Sort merged bids by createdAt descending
  const finalBids = mergedBids.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  return (
    <main className="bg-[#F8FAFC] py-6 lg:py-10 min-h-screen animate-fade-in overflow-x-hidden">
      <div className="container px-4">
        {/* Breadcrumb - Refined */}
        <div className="flex flex-wrap items-center gap-2 text-[0.75rem] lg:text-[0.8rem] font-semibold mb-6 lg:mb-10 uppercase tracking-wider text-[#64748B]">
            <Link href="/" className="text-primary no-underline hover:underline">Home</Link>
            <span className="text-[#BBB] font-normal">/</span>
            <Link href={`/live-auctions?category=${auction.product.category?.slug}`} className="text-primary no-underline hover:underline">
                {auction.product.category?.name || 'Real Estate'}
            </Link>
            <span className="text-[#BBB] font-normal">/</span>
            <span className="text-[#111] font-bold line-clamp-1">{auction.product.title}</span>
        </div>

        {/* Main Product Section - Refined Grid */}
        <div className="bg-white rounded-[20px] lg:rounded-[25px] p-6 lg:p-10 shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-[#F1F5F9] grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
            {/* Left Gallery */}
            <div className="flex flex-col gap-5">
                <div className="relative aspect-[4/3] rounded-xl lg:rounded-2xl overflow-hidden border border-[#F0F0F0] shadow-sm bg-[#F8FAFC]">
                    <div className="absolute top-4 left-4 lg:top-6 lg:left-6 bg-[#FF9800] text-white px-4 py-1.5 lg:px-5 lg:py-2 rounded-lg font-bold text-[0.7rem] uppercase z-10 shadow-lg tracking-wider">
                        HOT AUCTION
                    </div>
                    <img 
                      src={media[activeImage]?.url || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                      alt="Main Product" 
                      className="w-full h-full object-cover" 
                    />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x no-scrollbar">
                    {(media.length > 0 ? media : Array(4).fill(0)).map((item: any, idx: number) => (
                        <div 
                            key={idx} 
                            className={`flex-shrink-0 w-24 h-18 lg:w-28 lg:h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 snap-start ${activeImage === idx ? 'border-primary scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            onClick={() => setActiveImage(idx)}
                        >
                            <img src={item?.url || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800'} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Info Column */}
            <div className="flex flex-col">
                <h1 className="text-[1.8rem] md:text-[2.2rem] lg:text-[2.6rem] font-extrabold mb-4 text-[#111] leading-[1.2] tracking-tight uppercase">
                    {auction.product.title}
                </h1>
                
                <div className="flex flex-wrap gap-x-6 lg:gap-x-8 gap-y-3 mb-8 lg:mb-10">
                    <span className="text-[0.8rem] text-[#64748B] font-semibold flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-primary/70"></i> Nationwide
                    </span>
                    <span className="text-[0.8rem] text-[#64748B] font-semibold flex items-center gap-2">
                        <i className="fas fa-eye text-primary/70"></i> 1,245 Views
                    </span>
                    <span className="text-[0.8rem] text-[#64748B] font-semibold flex items-center gap-2">
                        <i className="fas fa-gavel text-primary/70"></i> {auction.bidCount || 0} Bids
                    </span>
                    <span className="text-[0.8rem] text-[#64748B] font-semibold flex items-center gap-2">
                        <i className="fas fa-check-circle text-primary/70"></i> Certified
                    </span>
                </div>

                {/* Countdown Card - Only show if NOT ended */}
                {!isEnded && (
                    <div className="bg-[#FFF9EE] rounded-xl lg:rounded-2xl p-6 lg:p-8 text-center mb-8 lg:mb-10 border border-[#FF9800]/5">
                        <span className="text-[#FF9800] font-bold text-[0.7rem] uppercase tracking-[2px] mb-6 block">
                            <i className="far fa-clock mr-2"></i> AUCTION ENDS IN
                        </span>
                        <CountdownTimer endTime={auction.endTime} variant="large" />
                    </div>
                )}

                {/* Ended / Success Message Section */}
                {isEnded && (
                    <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-10 border-2 border-green-100 shadow-[0_15px_40px_rgba(34,197,94,0.08)] mb-10 animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <i className={`fas ${isSold ? 'fa-trophy' : 'fa-clock'} text-3xl text-green-600`}></i>
                            </div>
                            
                            <h2 className="text-2xl lg:text-3xl font-black text-[#111] mb-3 uppercase tracking-tight">
                                {isSold ? 'Auction Successful' : 'Auction Ended'}
                            </h2>
                            
                            {isSold && auction.highestBidder ? (
                                <div className="flex flex-col items-center">
                                    <p className="text-[#64748B] font-bold text-[1.1rem] mb-6">
                                        Congratulations to the winner!
                                    </p>
                                    <div className="flex items-center gap-4 bg-[#F8FAFC] px-8 py-5 rounded-2xl border border-[#F1F5F9]">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                                            <img src={auction.highestBidder.avatar || `https://ui-avatars.com/api/?name=${auction.highestBidder.username || 'A'}&background=C90000&color=fff`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-[0.7rem] text-[#888] font-black uppercase tracking-wider">Winning Bidder</span>
                                            <span className="block text-[1.2rem] font-black text-[#111]">
                                                {auction.highestBidder.username || 'Anonymous User'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex flex-col items-center">
                                        <span className="text-[0.8rem] text-[#888] font-bold uppercase tracking-widest mb-1">Final Sale Price</span>
                                        <span className="text-[3rem] font-black text-green-600 leading-none tracking-tighter">${Number(currentBid).toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="mt-8 bg-green-50 px-8 py-4 rounded-xl border border-green-100">
                                        <p className="text-green-700 font-bold text-[0.9rem]">
                                            {isWinner 
                                              ? "Congratulations! You won this auction. Please proceed to 'My Bids' in your profile to complete the payment."
                                              : "This item has been sold. Check our other active auctions for more great deals!"
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : isSold ? (
                                <div className="flex flex-col items-center">
                                    <p className="text-[#64748B] font-bold text-[1.1rem] mb-6">This item has been sold via direct purchase.</p>
                                    <span className="bg-green-600 text-white px-10 py-4 rounded-xl font-black text-[1.2rem] uppercase shadow-lg">SOLD OUT</span>
                                    <div className="mt-8">
                                        <span className="text-[0.8rem] text-[#888] font-bold uppercase tracking-widest mb-1 block">Purchase Price</span>
                                        <span className="text-[3rem] font-black text-green-600 leading-none tracking-tighter">${Number(currentBid).toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[#64748B] font-bold text-[1.1rem]">This auction has concluded without a sale.</p>
                            )}
                        </div>
                    </div>
                )}

                {!isEnded && auction.type !== 'BUY_NOW_ONLY' && (
                    <div className="bg-[#F8FAFC] rounded-2xl p-5 md:p-6 border border-[#E2E8F0] mb-8 lg:mb-10 grid grid-cols-3 gap-4 md:gap-6 text-center select-none shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                        {/* Current Bid / Price */}
                        <div className="flex flex-col items-center justify-center border-r border-[#E2E8F0] px-1 md:px-3">
                            <span className="text-[0.68rem] text-[#64748B] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center">
                                <i className="fas fa-gavel text-primary/60 text-[0.7rem]"></i>
                                Current Bid
                            </span>
                            <span className="text-[1.3rem] md:text-[1.6rem] font-black text-[#0F172A] leading-none tracking-tight mb-1.5">
                                ${currentBid.toLocaleString()}
                            </span>
                            <span className="text-[0.65rem] text-[#94A3B8] font-bold">
                                Min Inc: ${Number(auction.bidIncrement || 100).toLocaleString()}
                            </span>
                        </div>

                        {/* Bids Counter */}
                        <div className="flex flex-col items-center justify-center border-r border-[#E2E8F0] px-1 md:px-3">
                            <span className="text-[0.68rem] text-[#64748B] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center">
                                <i className="fas fa-history text-[#64748B]/60 text-[0.7rem]"></i>
                                Total Bids
                            </span>
                            <span className="text-[1.3rem] md:text-[1.6rem] font-black text-[#0F172A] leading-none tracking-tight">
                                {liveBids.length || auction.bidCount || 0}
                            </span>
                        </div>

                        {/* Live Bidders / Watching */}
                        <div className="flex flex-col items-center justify-center px-1 md:px-3">
                            <span className="text-[0.68rem] text-[#64748B] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                Watching
                            </span>
                            <span className="text-[1.3rem] md:text-[1.6rem] font-black text-[#0F172A] leading-none tracking-tight">
                                {onlineBidders}
                            </span>
                        </div>
                    </div>
                )}

                {/* Bidding Terminal / Buy Now - Protected by Pro Membership */}
                {!isEnded && (
                    <div className="animate-fade-in">
                        {user?.isProMember ? (
                            <>
                                {(auction.type === 'BID_ONLY' || auction.type === 'BID_AND_BUY') && (
                                    <div className="mb-8 lg:mb-10">
                                        <AuctionBidder 
                                          auctionId={auctionId} 
                                          productId={auction.productId} 
                                          currentBid={currentBid} 
                                          bidIncrement={Number(auction.bidIncrement || 100)}
                                        />
                                    </div>
                                )}

                                {(auction.type === 'BUY_NOW_ONLY' || auction.type === 'BID_AND_BUY') && (
                                    <>
                                        <div className={`bg-[#F8FAFC] rounded-xl lg:rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border border-[#F1F5F9] shadow-sm ${auction.type === 'BUY_NOW_ONLY' ? 'mt-4' : 'mt-auto'}`}>
                                            <div className="flex flex-col gap-1 text-center sm:text-left">
                                                <span className="text-[0.7rem] text-[#64748B] font-extrabold uppercase tracking-[1px]">
                                                    {auction.type === 'BUY_NOW_ONLY' ? 'FIXED PRICE' : 'BUY IMMEDIATELY'}
                                                </span>
                                                <span className="text-[1.8rem] lg:text-[2.2rem] font-black text-[#111] leading-none tracking-tight">
                                                    ${buyNowPrice.toLocaleString()}
                                                </span>
                                            </div>
                                            <button 
                                                disabled={isBuyNowDisabled}
                                                onClick={() => !isBuyNowDisabled && setShowBuyNow(true)}
                                                className={isBuyNowDisabled
                                                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 w-full sm:w-auto px-8 lg:px-10 py-3.5 lg:py-4 rounded-lg font-bold text-[0.9rem] cursor-not-allowed uppercase tracking-wider"
                                                    : "bg-white text-primary border-2 border-primary/20 w-full sm:w-auto px-8 lg:px-10 py-3.5 lg:py-4 rounded-lg font-bold text-[0.9rem] transition-all hover:bg-primary hover:text-white hover:border-primary shadow-sm active:scale-95 uppercase tracking-wider"
                                                }
                                            >
                                                {isBuyNowDisabled ? "Buy Now Disabled — Active Bidding Started" : "Buy Now"}
                                            </button>
                                        </div>
                                        <CommissionBreakdown productId={auction.productId} amount={buyNowPrice} />
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-3xl p-8 lg:p-10 border-2 border-primary/10 shadow-[0_10px_35px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                                    <i className="fas fa-gem text-[7rem] text-primary"></i>
                                </div>
                                <div className="relative z-10 flex flex-col items-start">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-5 shadow-inner">
                                        <i className="fas fa-gem text-lg"></i>
                                    </div>
                                    <h3 className="text-[1.35rem] font-black mb-3 uppercase tracking-tight text-[#0F172A]">Unlock Pro Access</h3>
                                    <p className="text-[#64748B] font-bold text-[0.88rem] mb-6 leading-relaxed max-w-md">
                                        Bidding and instant purchases are exclusive to Pro Members. Join our elite community to start bidding today.
                                    </p>
                                    <Link 
                                        href="/membership"
                                        className="bg-primary text-white inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-black text-[0.8rem] uppercase tracking-wider transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_10px_25px_rgba(201,0,0,0.15)] shadow-md"
                                    >
                                        Upgrade to Pro — ${membershipFee} One time
                                    </Link>
                                    <div className="w-full mt-6 pt-5 border-t border-[#F1F5F9] flex items-center gap-3">
                                        <div className="flex -space-x-2.5">
                                            {proBiddersAvatars.map((u, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-[#F1F5F9] overflow-hidden flex items-center justify-center text-[0.65rem] font-black text-[#475569] shadow-sm shrink-0">
                                                    {u.avatar ? (
                                                        <img src={u.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{u.initial}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[0.78rem] text-[#64748B] font-bold">Joined by {proBiddersCount.toLocaleString()}+ Pro bidders this week</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Tabs Section - Refined */}
        <div className="mt-10 lg:mt-12 bg-white rounded-xl lg:rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div className="border-b border-[#F1F5F9] flex overflow-x-auto no-scrollbar bg-[#FCFDFF]">
                {['description', 'specifications', 'bidding history'].map((tab) => (
                    <button
                        key={tab}
                        className={`px-8 lg:px-12 py-5 lg:py-6 bg-transparent border-none font-bold text-[0.8rem] lg:text-[0.9rem] tracking-wider cursor-pointer transition-all duration-300 border-b-4 uppercase whitespace-nowrap ${activeTab === tab ? 'text-primary border-primary' : 'text-[#94A3B8] border-transparent hover:text-[#111]'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            
            <div className="p-8 lg:p-12">
                {activeTab === 'description' && (
                    <div className="text-[0.95rem] lg:text-[1.1rem] text-[#555] leading-relaxed max-w-4xl font-medium">
                        <p>{auction.product.description}</p>
                    </div>
                )}
                {activeTab === 'specifications' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8">
                        <div className="flex justify-between items-center p-6 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]/50">
                            <span className="font-bold text-[#64748B] uppercase text-[0.7rem] tracking-widest">Category</span>
                            <span className="font-bold text-[#111] text-[1rem]">{auction.product.category?.name}</span>
                        </div>
                        <div className="flex justify-between items-center p-6 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]/50">
                            <span className="font-bold text-[#64748B] uppercase text-[0.7rem] tracking-widest">Condition</span>
                            <span className="font-bold text-[#111] text-[1rem]">{auction.product.condition || 'Certified'}</span>
                        </div>
                    </div>
                )}
                {activeTab === 'bidding history' && (
                    <div className="overflow-x-auto -mx-8 lg:mx-0">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b-2 border-[#F1F5F9] bg-[#F8FAFC]">
                                    <th className="p-6 text-[#111] font-bold uppercase text-[0.7rem] tracking-[2px]">S.No</th>
                                    <th className="p-6 text-[#111] font-bold uppercase text-[0.7rem] tracking-[2px]">Bidder</th>
                                    <th className="p-6 text-[#111] font-bold uppercase text-[0.7rem] tracking-[2px]">Bid Amount</th>
                                    <th className="p-6 text-[#111] font-bold uppercase text-[0.7rem] tracking-[2px]">Time</th>
                                    <th className="p-6 text-[#111] font-bold uppercase text-[0.7rem] tracking-[2px]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalBids.length > 0 ? (
                                    finalBids.map((bid: any, i: number) => {
                                        const isWinner = isSold && auction.highestBidderId === bid.userId && i === 0;
                                        return (
                                            <tr key={bid.id} className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors ${isWinner ? 'bg-green-50/30' : ''}`}>
                                                <td className="p-6 font-bold text-[#64748B] text-[0.9rem]">{i + 1 < 10 ? `0${i + 1}` : i + 1}</td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#EEE]">
                                                            <img src={bid.user?.avatar || `https://ui-avatars.com/api/?name=${bid.user?.username || 'A'}&background=random`} className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="font-bold text-[#111] text-[0.95rem]">
                                                            {bid.user?.username || 'Anonymous User'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`font-black text-[1.2rem] ${isWinner ? 'text-green-600' : 'text-[#111]'}`}>
                                                        ${Number(bid.amount).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-[#94A3B8] font-semibold text-[0.85rem]">
                                                    {new Date(bid.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="p-6">
                                                    {isWinner ? (
                                                        <span className="bg-green-600 text-white px-4 py-1.5 rounded-full font-black text-[0.65rem] uppercase flex items-center gap-2 w-fit shadow-md animate-bounce">
                                                            <i className="fas fa-trophy"></i> Winner
                                                        </span>
                                                    ) : (
                                                        <span className="bg-[#F1F5F9] text-[#64748B] px-4 py-1.5 rounded-full font-bold text-[0.65rem] uppercase w-fit">
                                                            Outbid
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <i className="fas fa-gavel text-4xl text-[#DDD] mb-4"></i>
                                                <p className="text-[#94A3B8] font-bold text-[1.1rem]">No bidding activity recorded for this item.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
        
        {showBuyNow && (
            <BuyNowModal 
                auction={auction} 
                onClose={() => setShowBuyNow(false)}
                onSuccess={() => {
                    setShowBuyNow(false);
                    // Refresh data or redirect
                    window.location.reload();
                }}
            />
        )}
      </div>
    </main>
  );
}
