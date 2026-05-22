'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { notificationsService } from '@/services/admin.service';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCheck, 
  Clock, 
  Package, 
  Gavel, 
  Users,
  Eye,
  CheckCircle2,
  Inbox,
  CreditCard
} from 'lucide-react';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';

const NOTIFICATION_TYPE_MAP: Record<string, { label: string, color: string, icon: any }> = {
  SYSTEM: { label: 'System', color: 'badge-secondary', icon: Bell },
  AUCTION_UPDATE: { label: 'Auction', color: 'badge-warning', icon: Gavel },
  BID_OUTBID: { label: 'Bid Outbid', color: 'badge-info', icon: Gavel },
  BID_PLACED: { label: 'Bid Placed', color: 'badge-primary', icon: Gavel },
  ORDER_STATUS: { label: 'Order', color: 'badge-info', icon: Package },
  PAYMENT_STATUS: { label: 'Payment', color: 'badge-success', icon: CreditCard },
  MEMBERSHIP: { label: 'Membership', color: 'badge-primary', icon: Users },
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin-notifications', page, debouncedSearch, typeFilter, readFilter],
    queryFn: () => notificationsService.findAll({ 
      page, 
      limit: 20, 
      search: debouncedSearch,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      isRead: readFilter !== 'ALL' ? (readFilter === 'true') : undefined
    })
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.patch(`${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.patch('read-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const handleViewDetail = (notification: any) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    let data: any = {};
    if (notification.data) {
      if (typeof notification.data === 'string') {
        try {
          data = JSON.parse(notification.data);
        } catch {
          data = {};
        }
      } else {
        data = notification.data;
      }
    }

    if (notification.type === 'ORDER_STATUS' && data.orderId) {
      router.push(`/orders/${data.orderId}`);
    } else if (
      (notification.type === 'BID_PLACED' || notification.type === 'BID_OUTBID' || notification.type === 'AUCTION_UPDATE') &&
      (data.productId || data.auction?.productId)
    ) {
      router.push(`/products/${data.productId || data.auction?.productId}/edit`);
    } else if (
      (notification.type === 'SYSTEM' || notification.type === 'MEMBERSHIP') &&
      (data.userId || notification.user?.id)
    ) {
      router.push(`/users/${data.userId || notification.user?.id}/edit`);
    } else {
      setSelectedNotification(notification);
      setIsDetailModalOpen(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white border border-slate-200 text-slate-400">
                <Bell size={20} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">System Alerts</h1>
                <p className="text-xs text-slate-500 font-medium">Monitor audit logs and real-time operational notifications.</p>
             </div>
          </div>
          <Button variant="default" onClick={() => markAllReadMutation.mutate()} isLoading={markAllReadMutation.isPending} className="uppercase tracking-widest text-[10px] font-black py-2.5">
            <CheckCheck className="w-3.5 h-3.5 mr-2" /> Mark All as Read
          </Button>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search alerts, messages, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-input w-40">
                <option value="ALL">All Alert Types</option>
                {Object.entries(NOTIFICATION_TYPE_MAP).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              <select value={readFilter} onChange={(e) => setReadFilter(e.target.value)} className="admin-input w-40">
                <option value="ALL">All Status</option>
                <option value="false">Unread Only</option>
                <option value="true">Read Only</option>
              </select>
              <Button variant="default" className="px-3"><Filter size={14} /></Button>
            </div>
          </div>
        </Card>

        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th className="w-[40px]"></th>
                  <th>User</th>
                  <th>Alert Details</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={6} rows={10} />
                ) : notificationsData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No alerts found in log</p>
                    </td>
                  </tr>
                ) : (
                  notificationsData.items.map((notification: any) => {
                    const type = NOTIFICATION_TYPE_MAP[notification.type] || NOTIFICATION_TYPE_MAP.SYSTEM;
                    return (
                      <tr key={notification.id}>
                        <td>
                          {!notification.isRead ? (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mx-auto" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-200 mx-auto" />
                          )}
                        </td>
                        <td>
                          <p className="text-xs font-bold text-slate-800 leading-tight">@{notification.user?.username}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{notification.user?.email}</p>
                        </td>
                        <td>
                          <p className={`text-xs leading-tight ${!notification.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{notification.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{notification.message}</p>
                        </td>
                        <td>
                          <span className={`badge ${type.color}`}>{type.label}</span>
                        </td>
                        <td>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(notification.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="text-right">
                          <button onClick={() => handleViewDetail(notification)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {notificationsData?.meta && notificationsData.meta.lastPage > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Page {notificationsData.meta.page} of {notificationsData.meta.lastPage}</span>
              <div className="flex gap-1">
                <Button variant="default" size="xs" onClick={() => setPage(p=>Math.max(1, p-1))} disabled={page === 1}>Prev</Button>
                <Button variant="default" size="xs" onClick={() => setPage(p=>p+1)} disabled={page >= notificationsData.meta.lastPage}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Alert Archive Details"
        maxWidth="max-w-md"
      >
        {selectedNotification && (
          <div className="space-y-6 py-2">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                 <h3 className="text-sm font-black text-slate-900 leading-tight mb-1">{selectedNotification.title}</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
              </div>
              <span className={`badge ${NOTIFICATION_TYPE_MAP[selectedNotification.type]?.color || 'badge-secondary'}`}>
                {NOTIFICATION_TYPE_MAP[selectedNotification.type]?.label || 'System'}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">{selectedNotification.message}</p>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
               <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-3">Recipient Identity</p>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-sm flex items-center justify-center font-black text-blue-600 text-xs">
                    {selectedNotification.user?.username?.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">@{selectedNotification.user?.username}</p>
                    <p className="text-[10px] text-slate-500">{selectedNotification.user?.email}</p>
                  </div>
               </div>
            </div>

            {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">Metadata Payload</p>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-sm text-[10px] overflow-x-auto font-mono">
                  {JSON.stringify(selectedNotification.data, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
               <Button variant="primary" size="sm" className="px-6 uppercase tracking-widest text-[10px] font-black" onClick={() => setIsDetailModalOpen(false)}>Close Archive</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
