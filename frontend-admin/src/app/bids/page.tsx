'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { biddingService } from '@/services/admin.service';
import { Gavel, Search, Filter, Eye, ShieldAlert, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';

const BID_STATUS_MAP: Record<string, { label: string, color: string }> = {
  VALID: { label: 'Valid', color: 'badge-success' },
  OUTBID: { label: 'Outbid', color: 'badge-secondary' },
  RETRACTED: { label: 'Retracted', color: 'badge-warning' },
  WINNING: { label: 'Winning', color: 'badge-primary' },
  SUSPICIOUS: { label: 'Suspicious', color: 'badge-danger' },
};

export default function BidsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bidsData, isLoading, error } = useQuery({
    queryKey: ['admin-bids', searchTerm],
    queryFn: () => biddingService.findAll({ search: searchTerm, limit: 20 }),
    retry: 1
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-white border border-slate-200 text-slate-400"><Gavel size={20} /></div>
           <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Bid Monitoring</h1>
              <p className="text-xs text-slate-500 font-medium">Track real-time auction activity and investigate suspicious bids.</p>
           </div>
        </div>

        {error && (
           <div className="bg-red-50 border border-red-200 text-red-600 p-4 flex items-center gap-3 rounded-sm mb-4">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">Failed to load bids. Please ensure you have READ_BID permissions.</p>
           </div>
        )}

        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by bidder, product, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-9"
            />
          </div>
        </Card>

        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Product / Auction</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={6} rows={10} />
                ) : !bidsData?.items || bidsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      {error ? 'Error loading data' : 'No bid activity recorded.'}
                    </td>
                  </tr>
                ) : (
                  bidsData?.items?.map((bid: any) => {
                    const status = BID_STATUS_MAP[bid.status] || BID_STATUS_MAP.VALID;
                    return (
                      <tr key={bid.id}>
                        <td>
                          <p className="text-xs font-bold text-blue-600 leading-tight">@{bid.user?.username || 'user'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{bid.user?.email || 'N/A'}</p>
                        </td>
                        <td>
                           <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[200px]">{bid.auction?.product?.title || 'Unknown Product'}</p>
                           <p className="text-[9px] font-mono text-slate-400 uppercase">AUC: {bid.auctionId?.substring(0, 8) || 'N/A'}</p>
                        </td>
                        <td>
                          <span className="text-xs font-black text-slate-900">${Number(bid.amount || 0).toLocaleString()}</span>
                        </td>
                        <td>
                          <span className={`badge ${status.color}`}>{status.label}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-slate-500">
                             <Clock size={10} />
                             <span className="text-[10px] font-medium">{new Date(bid.createdAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="text-right">
                           <div className="flex justify-end gap-1">
                              <button className="p-1.5 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                              <button className="p-1.5 text-slate-400 hover:text-red-600"><ShieldAlert size={14} /></button>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
