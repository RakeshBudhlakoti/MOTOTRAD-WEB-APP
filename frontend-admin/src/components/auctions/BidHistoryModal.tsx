'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionService } from '@/services/auction.service';
import Button from '@/components/common/Button';
import { Trash2, Gavel, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface BidHistoryModalProps {
  auctionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BidHistoryModal({ auctionId, isOpen, onClose }: BidHistoryModalProps) {
  const queryClient = useQueryClient();

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: () => auctionService.getAuction(auctionId),
    enabled: isOpen && !!auctionId,
  });

  const removeBidMutation = useMutation({
    mutationFn: auctionService.removeBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-bids', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      toast.success('Bid retracted successfully');
    },
    onError: () => toast.error('Failed to retract bid'),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase">Bidding History</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{auction?.product?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-0 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                <tr>
                  <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">Bidder</th>
                  <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(auction?.bids || []).map((bid: any) => (
                  <tr key={bid.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${bid.status === 'RETRACTED' ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={bid.user?.avatar || `https://ui-avatars.com/api/?name=${bid.user?.username}&background=random`} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-sm">{bid.user?.firstName} {bid.user?.lastName}</p>
                          <p className="text-xs text-slate-500">@{bid.user?.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-blue-600">${Number(bid.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(bid.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bid.status === 'VALID' ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Retract this bid? This cannot be undone.')) {
                              removeBidMutation.mutate({ auctionId, bidId: bid.id });
                            }
                          }}
                          disabled={removeBidMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-[0.6rem] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded">Retracted</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(auction?.bids || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No bids placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
