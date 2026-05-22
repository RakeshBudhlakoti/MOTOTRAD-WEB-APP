'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ordersService } from '@/services/admin.service';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Truck
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';
import { useRouter } from 'next/navigation';

const getOrderStatusInfo = (status: string) => {
  const map: Record<string, { label: string, color: string }> = {
    PENDING_PAYMENT: { label: 'Pending Payment', color: 'badge-warning' },
    DEPOSIT_PAID: { label: 'Deposit Paid', color: 'badge-info' },
    PARTIALLY_PAID: { label: 'Partially Paid', color: 'badge-info' },
    FULLY_PAID: { label: 'Fully Paid', color: 'badge-success' },
    PROCESSING: { label: 'Processing', color: 'badge-info' },
    SHIPPED: { label: 'Shipped', color: 'badge-primary' },
    DELIVERED: { label: 'Delivered', color: 'badge-success' },
    CANCELLED: { label: 'Cancelled', color: 'badge-danger' },
    REFUNDED: { label: 'Refunded', color: 'badge-secondary' },
  };
  return map[status] || { label: status?.replace(/_/g, ' ') || 'Unknown', color: 'badge-warning' };
};

const getPaymentStatusInfo = (status: string) => {
  if (status === 'PENDING_PAYMENT') {
    return { label: 'Unpaid', color: 'text-red-600 font-black bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/30' };
  }
  if (status === 'DEPOSIT_PAID' || status === 'PARTIALLY_PAID') {
    return { label: 'Partial', color: 'text-amber-600 font-black bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/30' };
  }
  if (['FULLY_PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) {
    return { label: 'Paid', color: 'text-green-600 font-black bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/30' };
  }
  if (status === 'CANCELLED') {
    return { label: 'Cancelled', color: 'text-slate-500 font-black bg-slate-50 dark:bg-slate-900/20 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800' };
  }
  if (status === 'REFUNDED') {
    return { label: 'Refunded', color: 'text-blue-500 font-black bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/30' };
  }
  return { label: 'Unpaid', color: 'text-red-600 font-black bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/30' };
};

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', page, searchTerm, statusFilter],
    queryFn: () => ordersService.findAll({ 
      page, 
      limit: 10, 
      search: searchTerm,
      status: statusFilter !== 'ALL' ? statusFilter : undefined
    })
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white border border-slate-200 text-slate-400">
                <ShoppingCart size={20} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Sales & Orders</h1>
                <p className="text-xs text-slate-500 font-medium">Monitor transactions, payment status, and fulfillment.</p>
             </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Order ID, Customer, or Product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-input w-44"
              >
                <option value="ALL">All Order Status</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="DEPOSIT_PAID">Deposit Paid</option>
                <option value="FULLY_PAID">Fully Paid</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <Button variant="default" className="px-3"><Filter size={14} /></Button>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th className="w-[100px]">Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Financials</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={7} rows={8} />
                ) : !ordersData?.items || ordersData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  ordersData?.items?.map((order: any) => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    const paymentStatusInfo = getPaymentStatusInfo(order.status);
                    const buyerName = order.buyer ? `@${order.buyer.username}` : '@user';
                    const buyerEmail = order.buyer?.email || 'no-email';
                    const productTitle = order.auction?.product?.title || 'Unknown Product';
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="text-xs font-mono font-black text-slate-500">#{order.id.substring(0, 8)}</span>
                        </td>
                        <td>
                          <p className="font-bold text-slate-800 leading-tight">{buyerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{buyerEmail}</p>
                        </td>
                        <td>
                          <p className="text-xs font-bold text-slate-700 leading-tight truncate max-w-[200px]" title={productTitle}>
                            {productTitle}
                          </p>
                        </td>
                        <td>
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-slate-900">${Number(order.finalAmount).toLocaleString()}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Incl. Comm: ${Number(order.commissionAmount).toLocaleString()}</p>
                          </div>
                        </td>
                        <td>
                           <span className={`text-[9px] uppercase tracking-wider ${paymentStatusInfo.color}`}>
                             {paymentStatusInfo.label}
                           </span>
                        </td>
                        <td>
                          <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 rounded-sm"
                              title="View Detail"
                            >
                              <Eye size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all border border-transparent hover:border-green-100 rounded-sm">
                               <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersData?.meta && ordersData.meta.lastPage > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Showing {ordersData.meta.page} of {ordersData.meta.lastPage} Pages
              </span>
              <div className="flex gap-1">
                <Button variant="default" size="xs" onClick={() => setPage(p=>Math.max(1, p-1))} disabled={page === 1}>Prev</Button>
                <Button variant="default" size="xs" onClick={() => setPage(p=>p+1)} disabled={page >= ordersData.meta.lastPage}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
