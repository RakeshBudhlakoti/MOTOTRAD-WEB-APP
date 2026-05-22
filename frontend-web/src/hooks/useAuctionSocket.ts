import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '@/lib/socket';
import { setLiveBid } from '@/store/slices/auctionSlice';
import { RootState } from '@/store';
import toast from 'react-hot-toast';

export const useAuctionSocket = (auctionId: string) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const [onlineCount, setOnlineCount] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState<string | null>(null);

  useEffect(() => {
    const socket = socketService.connect(token || undefined);

    socket.emit('join_auction', { auctionId });

    socket.on('bid_placed', (bid) => {
      dispatch(setLiveBid({ auctionId, bid }));
      toast.success(`New bid: $${bid.amount.toLocaleString()}`, {
        icon: '🔥',
        position: 'bottom-right'
      });
    });

    socket.on('auction_extended', (data) => {
      // In a real app, you would dispatch to Redux to sync the timer
      // dispatch(updateAuctionEndTime({ auctionId: data.auctionId, endTime: data.newEndTime }));
      toast('Auction Extended! Anti-Snipe Active', { 
        icon: '⏳',
        style: { background: '#2563eb', color: '#fff' }
      });
    });

    socket.on('auction_ended', (data) => {
      setAuctionStatus('ENDED');
      toast.success(`Auction Ended! Winner: ${data.winnerName}`, { icon: '🏆' });
    });

    socket.on('presence_update', (count) => {
      setOnlineCount(count);
    });

    socket.on('bid_error', (err) => {
      toast.error(err.message);
    });

    return () => {
      socket.off('bid_placed');
      socket.off('auction_extended');
      socket.off('auction_ended');
      socket.off('presence_update');
      socket.off('bid_error');
    };
  }, [auctionId, token, dispatch]);

  const placeBid = useCallback((amount: number) => {
    socketService.emit('place_bid', { auctionId, amount });
  }, [auctionId]);

  return { onlineCount, auctionStatus, placeBid };
};

