'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  ShoppingCart, 
  Gavel, 
  DollarSign, 
  Package, 
  UserCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Layers,
  FolderOpen,
  Plus,
  Settings,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Calendar,
  CreditCard,
  Percent,
  CheckCircle2,
  Eye,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/admin.service';
import { Card } from '@/components/common/Card';
import Link from 'next/link';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: () => analyticsService.getDashboardOverview(),
    retry: 1
  });

  // Fallbacks to avoid NaN division by zero if database is clean/empty
  const maxRevenueAmount = Math.max(...(stats?.charts?.monthlyRevenue?.map((r: any) => Number(r.amount)) || []), 100);
  const maxAuctionsCount = Math.max(...(stats?.charts?.monthlyAuctions?.map((a: any) => 
    Math.max(Number(a.created), Number(a.completed), Number(a.expired))
  ) || []), 5);

  const kpis = [
    { title: 'Total Users', value: stats?.kpis?.totalUsers ?? 0, icon: Users, color: 'border-l-blue-500 text-blue-600 bg-blue-50/40 border-blue-100', subtitle: 'Registered Accounts' },
    { title: 'Active Auctions', value: stats?.kpis?.activeAuctions ?? 0, icon: Gavel, color: 'border-l-emerald-500 text-emerald-600 bg-emerald-50/40 border-emerald-100', subtitle: 'Live Bidding Now' },
    { title: 'Pending Auctions', value: stats?.kpis?.pendingAuctions ?? 0, icon: Clock, color: 'border-l-amber-500 text-amber-600 bg-amber-50/40 border-amber-100', subtitle: 'Awaiting Start Time' },
    { title: 'Sold Products', value: stats?.kpis?.soldProducts ?? 0, icon: Package, color: 'border-l-indigo-500 text-indigo-600 bg-indigo-50/40 border-indigo-100', subtitle: 'Completed Deals' },
    { title: 'Total Orders', value: stats?.kpis?.totalOrders ?? 0, icon: ShoppingCart, color: 'border-l-pink-500 text-pink-600 bg-pink-50/40 border-pink-100', subtitle: 'Checkout Invoices' },
    { title: 'Revenue', value: `$${Number(stats?.kpis?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'border-l-teal-500 text-teal-600 bg-teal-50/40 border-teal-100', subtitle: 'Sum of Paid Funds' },
    { title: 'Pending Payments', value: `$${Number(stats?.kpis?.pendingPayments || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: AlertTriangle, color: 'border-l-rose-500 text-rose-600 bg-rose-50/40 border-rose-100', subtitle: 'Outstanding Balances' },
    { title: 'Total Bids', value: stats?.kpis?.totalBids ?? 0, icon: TrendingUp, color: 'border-l-violet-500 text-violet-600 bg-violet-50/40 border-violet-100', subtitle: 'Placed Bids Count' },
    { title: 'Featured Products', value: stats?.kpis?.featuredProducts ?? 0, icon: Sparkles, color: 'border-l-yellow-500 text-yellow-600 bg-yellow-50/40 border-yellow-100', subtitle: 'Featured Showcases' },
    { title: 'Total Categories', value: stats?.kpis?.totalCategories ?? 0, icon: Layers, color: 'border-l-cyan-500 text-cyan-600 bg-cyan-50/40 border-cyan-100', subtitle: 'System Categories' },
    { title: 'Total Baskets', value: stats?.kpis?.totalBaskets ?? 0, icon: FolderOpen, color: 'border-l-lime-500 text-lime-600 bg-lime-50/40 border-lime-100', subtitle: 'Auction Baskets' },
    { title: 'Total Sellers', value: stats?.kpis?.totalSellers ?? 0, icon: UserCheck, color: 'border-l-sky-500 text-sky-600 bg-sky-50/40 border-sky-100', subtitle: 'Verified Sellers' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        
        {/* Error Notification banner */}
        {statsError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md flex items-center gap-3 shadow-sm">
             <AlertTriangle size={20} className="shrink-0 text-rose-500 animate-bounce" />
             <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Access Warning</h4>
                <p className="text-[11px] font-bold text-rose-600/90 mt-0.5">
                   Unable to query system metrics. Please confirm your account is granted reports permissions (`VIEW_REPORTS`).
                </p>
             </div>
          </div>
        )}

        {/* Header Title with quick action subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">Dynamic Overview</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Live transactional performance & inventory indicators
            </p>
          </div>
          <div className="text-[10px] font-black text-slate-400 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-center">
            <Activity size={12} className="text-emerald-500 animate-pulse" />
            System Live Status
          </div>
        </div>

        {/* 1. QUICK SHORTCUTS PANEL */}
        <div className="bg-white border border-slate-200/80 rounded-md p-4 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3.5">Quick Shortcuts & Creator Panel</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <Link href="/products" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              Add Product
            </Link>
            <Link href="/categories" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-emerald-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              Add Category
            </Link>
            <Link href="/baskets" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-purple-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              Add Basket
            </Link>
            <Link href="/users" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-cyan-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              Add User
            </Link>
            <Link href="/sales/orders" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-orange-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Eye size={14} className="group-hover:scale-110 transition-transform" />
              View Orders
            </Link>
            <Link href="/sales/bids" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-amber-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Eye size={14} className="group-hover:scale-110 transition-transform" />
              View Bids
            </Link>
            <Link href="/settings" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-rose-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 group">
              <Settings size={14} className="group-hover:rotate-45 transition-transform" />
              Settings
            </Link>
          </div>
        </div>

        {/* 2. KPI GRID SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div 
                key={index} 
                className={`bg-white border ${kpi.color} border-l-4 rounded-md p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">{kpi.title}</p>
                    {statsLoading ? (
                      <div className="h-6 w-20 bg-slate-100 animate-pulse rounded mt-1.5" />
                    ) : (
                      <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">{kpi.value}</h3>
                    )}
                  </div>
                  <div className={`p-2 rounded border border-slate-100 ${kpi.color}`}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{kpi.subtitle}</span>
                  <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                    100% Real
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. CHARTS GRID (REAL ACCUMULATIONS ONLY) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Monthly Cash Flow / Revenue */}
          <Card 
            title="Monthly Revenue Performance" 
            headerActions={
              <button 
                onClick={async () => {
                  try {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/analytics/export/orders`;
                  } catch (e) {
                    console.error('Export failed', e);
                  }
                }}
                className="admin-btn admin-btn-default admin-btn-xs uppercase tracking-widest text-[9px] font-black flex items-center gap-1.5"
              >
                <FileText size={12} />
                Export CSV
              </button>
            }
          >
            <div className="flex flex-col h-[320px] justify-between">
              
              {/* Chart Grid Lines */}
              <div className="flex-grow flex items-end gap-3 px-2 pb-3 relative">
                
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-1">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="w-full border-t border-slate-100" />
                  ))}
                </div>

                {statsLoading ? (
                  <div className="absolute inset-0 bg-slate-50/50 flex items-center justify-center text-xs font-black uppercase text-slate-400 tracking-wider">
                    Loading Cash Flows...
                  </div>
                ) : !stats?.charts?.monthlyRevenue || stats.charts.monthlyRevenue.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase text-slate-400 tracking-wider">
                    No Revenue Data Registered
                  </div>
                ) : (
                  stats.charts.monthlyRevenue.map((r: any, idx: number) => {
                    const percent = Math.min(100, Math.max(4, (Number(r.amount) / maxRevenueAmount) * 100));
                    return (
                      <div key={idx} className="flex-grow flex flex-col justify-end items-center h-full relative group">
                        
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-black shadow shadow-black/20">
                          ${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>

                        {/* Bar Segment */}
                        <div 
                          className="w-full bg-blue-600/10 border-t border-blue-500 group-hover:bg-blue-600 transition-all rounded-t-sm relative cursor-pointer" 
                          style={{ height: `${percent}%` }}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Month X-Axis labels */}
              <div className="flex justify-between px-2 pt-2 border-t border-slate-200/80 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {stats?.charts?.monthlyRevenue?.map((r: any, idx: number) => (
                  <span key={idx} className="flex-1 text-center truncate">{r.month}</span>
                )) || <span>No Months Available</span>}
              </div>

              {/* Legend block */}
              <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                  Monthly Sales Settlements ($)
                </div>
              </div>

            </div>
          </Card>

          {/* Chart 2: Auctions Overview */}
          <Card title="Monthly Auctions Overview">
            <div className="flex flex-col h-[320px] justify-between">
              
              {/* Chart Grid Area */}
              <div className="flex-grow flex items-end gap-3 px-2 pb-3 relative">
                
                {/* Reference line indicators */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-1">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="w-full border-t border-slate-100" />
                  ))}
                </div>

                {statsLoading ? (
                  <div className="absolute inset-0 bg-slate-50/50 flex items-center justify-center text-xs font-black uppercase text-slate-400 tracking-wider">
                    Loading Auctions Data...
                  </div>
                ) : !stats?.charts?.monthlyAuctions || stats.charts.monthlyAuctions.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase text-slate-400 tracking-wider">
                    No Auctions Created
                  </div>
                ) : (
                  stats.charts.monthlyAuctions.map((a: any, idx: number) => {
                    const percentCreated = Math.min(100, Math.max(4, (Number(a.created) / maxAuctionsCount) * 100));
                    const percentCompleted = Math.min(100, Math.max(4, (Number(a.completed) / maxAuctionsCount) * 100));
                    const percentExpired = Math.min(100, Math.max(4, (Number(a.expired) / maxAuctionsCount) * 100));

                    return (
                      <div key={idx} className="flex-grow flex justify-center items-end h-full gap-0.5 relative group">
                        
                        {/* Hover Tooltip showing details */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-black shadow shadow-black/20 text-left space-y-0.5">
                          <p className="text-blue-300">Created: {a.created}</p>
                          <p className="text-emerald-300">Sold: {a.completed}</p>
                          <p className="text-rose-300">Expired: {a.expired}</p>
                        </div>

                        {/* Created bar (Blue) */}
                        <div 
                          className="w-2.5 bg-blue-400 hover:bg-blue-600 transition-all rounded-t-sm" 
                          style={{ height: `${percentCreated}%` }}
                        />
                        {/* Completed bar (Green) */}
                        <div 
                          className="w-2.5 bg-emerald-400 hover:bg-emerald-600 transition-all rounded-t-sm" 
                          style={{ height: `${percentCompleted}%` }}
                        />
                        {/* Expired bar (Red/Orange) */}
                        <div 
                          className="w-2.5 bg-rose-400 hover:bg-rose-600 transition-all rounded-t-sm" 
                          style={{ height: `${percentExpired}%` }}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Month X-Axis labels */}
              <div className="flex justify-between px-2 pt-2 border-t border-slate-200/80 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {stats?.charts?.monthlyAuctions?.map((a: any, idx: number) => (
                  <span key={idx} className="flex-1 text-center truncate">{a.month}</span>
                )) || <span>No Months Available</span>}
              </div>

              {/* Legends */}
              <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-blue-400" />
                  Created
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-400" />
                  Sold (Ended)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-rose-400" />
                  Expired (Unsold)
                </div>
              </div>

            </div>
          </Card>

        </div>

        {/* 4. LATEST ORDERS PANEL (REPLACED SYSTEM ACTIVITY LOG) */}
        <Card 
          title="Latest Invoices & Orders" 
          headerActions={
            <Link href="/sales/orders" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
              View All Orders
            </Link>
          }
        >
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product Details</th>
                  <th>Customer</th>
                  <th>Order Type</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Pending Balance</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {statsLoading ? (
                  <tr><td colSpan={10}><div className="h-40 bg-slate-50 animate-pulse" /></td></tr>
                ) : !stats?.latestOrders || stats.latestOrders.length === 0 ? (
                  <tr><td colSpan={10} className="py-10 text-center text-xs font-bold text-slate-400 uppercase">No registered orders registered</td></tr>
                ) : (
                  stats.latestOrders.map((order: any) => {
                    
                    // Style class helper based on Payment Status
                    let paymentBadgeColor = 'badge-secondary';
                    if (order.paymentStatus === 'Paid') paymentBadgeColor = 'badge-success';
                    else if (order.paymentStatus === 'Partial') paymentBadgeColor = 'badge-warning';
                    else if (order.paymentStatus === 'Pending') paymentBadgeColor = 'badge-danger';

                    // Style helper for Order Status
                    let orderBadgeColor = 'badge-secondary';
                    if (order.orderStatus === 'FULLY_PAID' || order.orderStatus === 'DELIVERED') orderBadgeColor = 'badge-primary';
                    else if (order.orderStatus === 'PROCESSING' || order.orderStatus === 'SHIPPED') orderBadgeColor = 'badge-info';
                    else if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REFUNDED') orderBadgeColor = 'badge-danger';

                    return (
                      <tr key={order.id}>
                        <td className="text-[10.5px] font-mono font-black text-slate-400">
                          #{order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {order.productImage ? (
                                <img src={order.productImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package size={14} className="text-slate-300" />
                              )}
                            </div>
                            <span className="font-bold text-slate-700 text-xs truncate max-w-[150px]">{order.product}</span>
                          </div>
                        </td>
                        <td className="text-xs font-bold text-slate-600">{order.customer}</td>
                        <td>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${order.orderType === 'Buy Now' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            {order.orderType}
                          </span>
                        </td>
                        <td className="text-xs font-black text-slate-900">${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="text-xs font-bold text-emerald-600">${order.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="text-xs font-bold text-rose-500">${order.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${paymentBadgeColor}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${orderBadgeColor}`}>
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-[10px] text-slate-400 font-bold uppercase tracking-tight whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 5. ACTIVE AUCTIONS TABLE */}
        <Card 
          title="Live Active Auctions" 
          headerActions={
            <Link href="/products" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
              Manage Auctions
            </Link>
          }
        >
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Auction Type</th>
                  <th>Category</th>
                  <th>Basket</th>
                  <th>Current Bid</th>
                  <th>Buy Now Price</th>
                  <th>Bid Count</th>
                  <th>Ending Time</th>
                  <th>Seller</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {statsLoading ? (
                  <tr><td colSpan={10}><div className="h-40 bg-slate-50 animate-pulse" /></td></tr>
                ) : !stats?.liveAuctions || stats.liveAuctions.length === 0 ? (
                  <tr><td colSpan={10} className="py-10 text-center text-xs font-bold text-slate-400 uppercase">No active auctions running</td></tr>
                ) : (
                  stats.liveAuctions.map((auc: any) => (
                    <tr key={auc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-sm border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {auc.productImage ? (
                              <img src={auc.productImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 truncate text-xs">{auc.productName}</p>
                            <p className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">ID: #{auc.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                          {auc.auctionType}
                        </span>
                      </td>
                      <td className="text-xs font-bold text-slate-600">{auc.category}</td>
                      <td className="text-xs font-bold text-slate-500 italic">{auc.basket}</td>
                      <td className="text-xs font-black text-slate-900">${auc.currentBid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="text-xs font-bold text-slate-500">
                        {auc.buyNowPrice ? `$${auc.buyNowPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                      </td>
                      <td>
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {auc.bidCount} Bids
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-orange-600">
                          <Clock size={12} />
                          <span className="text-xs font-black">{new Date(auc.endingTime).toLocaleDateString()} {new Date(auc.endingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="text-xs font-bold text-slate-600">{auc.seller}</td>
                      <td>
                        <span className="badge badge-success uppercase tracking-widest text-[8px] font-black px-1.5 py-0.5">
                          {auc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 6. ADDITIONAL DASHBOARD BLOCKS IN MULTI-COLUMN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column A: Recent Registrations & Payments Overview */}
          <div className="space-y-6">
            
            {/* Block A: Recent Registrations */}
            <Card title="Recent Registrations">
              <div className="space-y-4 min-h-[220px]">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded" />)}
                  </div>
                ) : !stats?.recentUsers || stats.recentUsers.length === 0 ? (
                  <p className="text-xs font-bold uppercase text-slate-400 text-center py-10">No users found</p>
                ) : (
                  stats.recentUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 text-xs font-black uppercase">
                          {user.name.substring(0, 2) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold leading-tight">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700">
                          {user.role}
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                          Joined: {new Date(user.joinedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Block B: Payment Overview */}
            <Card title="Payment Overview Details">
              <div className="grid grid-cols-3 gap-3 min-h-[80px]">
                <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Fully Paid</p>
                  <h4 className="text-base font-black text-emerald-700 mt-1">{stats?.paymentOverview?.fullyPaid ?? 0}</h4>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Partial Paid</p>
                  <h4 className="text-base font-black text-amber-700 mt-1">{stats?.paymentOverview?.partialPaid ?? 0}</h4>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-rose-600">Pending</p>
                  <h4 className="text-base font-black text-rose-700 mt-1">{stats?.paymentOverview?.pending ?? 0}</h4>
                </div>
              </div>
            </Card>

          </div>

          {/* Column B: Top Categories & Top Baskets */}
          <div className="space-y-6">
            
            {/* Block C: Top Categories */}
            <Card title="Top Product Categories">
              <div className="space-y-3 min-h-[180px]">
                {statsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-50 animate-pulse rounded" />)}
                  </div>
                ) : !stats?.categorySummary || stats.categorySummary.length === 0 ? (
                  <p className="text-xs font-bold uppercase text-slate-400 text-center py-10">No categories calculated</p>
                ) : (
                  stats.categorySummary.map((cat: any, idx: number) => (
                    <div key={cat.id} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {cat.count} Products
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Block D: Top Baskets */}
            <Card title="Top Active Baskets">
              <div className="space-y-3 min-h-[180px]">
                {statsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-50 animate-pulse rounded" />)}
                  </div>
                ) : !stats?.basketSummary || stats.basketSummary.length === 0 ? (
                  <p className="text-xs font-bold uppercase text-slate-400 text-center py-10">No baskets calculated</p>
                ) : (
                  stats.basketSummary.map((bas: any, idx: number) => (
                    <div key={bas.id} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{bas.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {bas.count} Products
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
