'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ordersService, shippingService } from '@/services/admin.service';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Download, 
  Mail, 
  Printer, 
  CreditCard, 
  Truck, 
  User, 
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Modal from '@/components/common/Modal';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [adminRemark, setAdminRemark] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => ordersService.get(id),
    enabled: !!id
  });

  const markCashMutation = useMutation({
    mutationFn: (data: any) => ordersService.post(`${id}/mark-cash`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      toast.success('Cash payment recorded successfully');
      setIsCashModalOpen(false);
      setCashAmount('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error recording payment')
  });

  const updateRemarksMutation = useMutation({
    mutationFn: (remark: string) => ordersService.post(`${id}/remarks`, { remark }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      toast.success('Remarks updated');
      setAdminRemark('');
    },
    onError: (err: any) => toast.error('Failed to update remarks')
  });

  const dispatchShipmentMutation = useMutation({
    mutationFn: async () => {
      // 1. Create a shipment record
      const shipment = await shippingService.post(id, {
        carrier: 'Mototrad Logistics',
        trackingNumber: `MT-LOG-${Date.now().toString().slice(-6)}`,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      });
      // 2. Dispatch status update to 'DISPATCHED'
      await shippingService.patch(`${id}/status`, {
        status: 'DISPATCHED',
        description: 'Vehicle picked up and dispatched from primary fulfillment hub.',
        location: 'Main Logistics Hub'
      });
      return shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      toast.success('Shipment successfully dispatched!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch shipment');
    }
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async (variables: { receiverName: string; receiverPhone: string; isRepresentative: boolean }) => {
      return await shippingService.patch(`${id}/status`, {
        status: 'DELIVERED',
        description: 'Vehicle successfully delivered.',
        location: 'Customer Location',
        receiverName: variables.receiverName,
        receiverPhone: variables.receiverPhone,
        isRepresentative: variables.isRepresentative
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      toast.success('Order marked as DELIVERED!');
      setIsDeliveryModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to mark as delivered');
    }
  });

  const openDeliveryHandoverModal = () => {
    setReceiverName(order?.buyer?.name || order?.buyer?.email || '');
    setReceiverPhone(order?.buyer?.phone || '');
    setIsRepresentative(false);
    setIsDeliveryModalOpen(true);
  };

  if (isLoading) return <DashboardLayout><div className="p-20 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Loading order details...</div></DashboardLayout>;
  if (!order) return <DashboardLayout><div className="p-20 text-center text-xs font-bold uppercase tracking-widest text-red-500">Order not found.</div></DashboardLayout>;

  const pendingAmount = Number(order.finalAmount || 0) - (order.payments?.filter((p: any) => p.status === 'COMPLETED').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0);

  const generateInvoiceHTML = () => {
    const baseAmount = Number(order.baseAmount || 0);
    const commissionAmount = Number(order.commissionAmount || 0);
    const finalAmount = Number(order.finalAmount || 0);
    const paidAmount = order.payments?.filter((p: any) => p.status === 'COMPLETED').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
    const remainingAmount = finalAmount - paidAmount;

    return `
      <html>
        <head>
          <title>Invoice-${order.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,slnt,wdth,wght,ROND@8..144,-10..0,25..150,100..900,0..100&display=swap');
            body {
              font-family: 'Google Sans Flex', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo-container {
              display: flex;
              align-items: center;
            }
            .logo-m {
              width: 36px;
              height: 36px;
              background-color: #2563eb;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 900;
              font-size: 22px;
              margin-right: 12px;
            }
            .logo-text {
              font-weight: 800;
              font-size: 20px;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .logo-text span {
              color: #2563eb;
            }
            .title-info {
              text-align: right;
            }
            .title-info h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 900;
              color: #0f172a;
            }
            .details-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            .details-section h3 {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .details-section p {
              margin: 4px 0;
              font-size: 14px;
            }
            .details-section .bold {
              font-weight: 700;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            th {
              background-color: #f8fafc;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
              text-align: left;
              padding: 12px;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 16px 12px;
              font-size: 14px;
              border-bottom: 1px solid #f1f5f9;
            }
            .total-section {
              margin-left: auto;
              width: 350px;
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              border: 1px solid #e2e8f0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .total-row:last-child {
              margin-bottom: 0;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
            }
            .total-label {
              color: #64748b;
              font-weight: 500;
            }
            .total-value {
              font-weight: 700;
              color: #0f172a;
            }
            .grand-total {
              font-size: 18px;
              font-weight: 900;
              color: #2563eb;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-success { background-color: #dcfce7; color: #15803d; }
            .badge-warning { background-color: #fef9c3; color: #a16207; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <div class="logo-m" style="background-color: #0f172a;">M</div>
              <div class="logo-text">Mototrad <span>2.0</span></div>
            </div>
            <div class="title-info">
              <h1>INVOICE</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #64748b;">Order: #${order.orderNumber}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-section">
              <h3>Billed To</h3>
              <p class="bold">@${order.buyer?.username || 'user'}</p>
              <p>${order.buyer?.email}</p>
              <p>Registered Account</p>
            </div>
            <div class="details-section" style="text-align: right;">
              <h3>Invoice Details</h3>
              <p><span class="bold">Date Issued:</span> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><span class="bold">Payment Method:</span> PayPal / Balance Transfer</p>
              <p>
                <span class="bold">Order Status:</span> 
                <span class="badge ${order.status === 'FULLY_PAID' || order.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}">
                  ${order.status?.replace(/_/g, ' ')}
                </span>
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span class="bold">${order.auction?.product?.title || 'Vehicle Purchase'}</span>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Winning Bid Value on Auction ID: ${order.auctionId}</div>
                </td>
                <td style="text-align: right; font-weight: 600;">$${baseAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>
                  <span class="bold">Platform Commission Fee</span>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Calculated secure processing and platform service fee.</div>
                </td>
                <td style="text-align: right; font-weight: 600; color: #dc2626;">+ $${commissionAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 30px; margin-bottom: 30px;">
            <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #475569; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-align: left;">Payment & Settlement History</h3>
            <table style="margin-bottom: 20px; width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">Payment ID</th>
                  <th style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">Provider</th>
                  <th style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">Method</th>
                  <th style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">Date</th>
                  <th style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.payments && order.payments.length > 0 ? order.payments.map((p: any) => `
                  <tr>
                    <td style="padding: 12px 12px; font-family: monospace; font-size: 11px; color: #64748b; border-bottom: 1px solid #f1f5f9; text-align: left;">${p.id?.substring(0, 10) || 'N/A'}...</td>
                    <td style="padding: 12px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #334155; border-bottom: 1px solid #f1f5f9; text-align: left;">${p.provider}</td>
                    <td style="padding: 12px 12px; font-size: 12px; color: #475569; border-bottom: 1px solid #f1f5f9; text-align: left;">${p.paymentMethod || 'Online'}</td>
                    <td style="padding: 12px 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9; text-align: left;">${new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style="padding: 12px 12px; font-size: 12px; font-weight: bold; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">$${Number(p.amount || 0).toLocaleString()}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" style="padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold; border-bottom: 1px solid #f1f5f9;">NO PAYMENTS RECORDED</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Subtotal Due:</span>
              <span class="total-value">$${finalAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Total Amount Paid:</span>
              <span class="total-value" style="color: #16a34a;">$${paidAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span class="total-label grand-total">Remaining Due:</span>
              <span class="total-value grand-total">$${remainingAmount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mototrad. All rights reserved.</p>
            <p>Thank you for buying through Mototrad. For any billing support, please contact billing@mototrad.com.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the invoice');
      return;
    }
    printWindow.document.write(generateInvoiceHTML());
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download the PDF');
      return;
    }
    printWindow.document.title = `Invoice-${order.orderNumber}`;
    printWindow.document.write(generateInvoiceHTML());
    printWindow.document.close();
  };

  const isFullyPaid = order.status === 'FULLY_PAID' || order.status === 'DELIVERED';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors">
               <ArrowLeft size={16} />
             </button>
             <div>
                <h1 className="text-xl font-bold text-slate-800">Order #{order.id?.substring(0, 8) || 'N/A'}</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Date Placed: {new Date(order.createdAt).toLocaleString()}</p>
             </div>
           </div>
           <div className="flex gap-2">
             <Button variant="default" className="text-xs py-2 px-4 uppercase tracking-widest font-black" onClick={() => {
                toast.promise(ordersService.post(`${id}/remind`, {}), {
                  loading: 'Sending...',
                  success: isFullyPaid ? 'Invoice sent successfully' : 'Reminder sent successfully',
                  error: 'Failed to send'
                });
             }}>
               <Mail size={14} className="mr-2" /> {isFullyPaid ? 'Send Invoice' : 'Send Reminder'}
             </Button>
             <Button variant="outline" className="text-xs py-2 px-4 uppercase tracking-widest font-black" onClick={handlePrint}>
               <Printer size={14} className="mr-2" /> Print Invoice
             </Button>
             <Button variant="primary" className="text-xs py-2 px-4 uppercase tracking-widest font-black" onClick={handleDownloadPDF}>
               <Download size={14} className="mr-2" /> Download PDF
             </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Invoice Information">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</p>
                    <p className="text-sm font-bold text-slate-800">@{order.buyer?.username || 'user'}</p>
                    <p className="text-xs font-medium text-slate-500">{order.buyer?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{order.auction?.product?.title || 'Unknown Product'}</p>
                    <p className="text-xs font-medium text-slate-500">ID: {order.auction?.productId?.substring(0, 8) || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order No.</p>
                    <p className="text-sm font-bold text-slate-800">{order.orderNumber}</p>
                    <p className="text-xs font-medium text-slate-500">Mototrad-ID</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Status</p>
                    <span className={`badge ${order.status === 'FULLY_PAID' || order.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>
                       {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Financial Summary</h4>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm font-medium text-slate-600">Base Amount (Winning Bid)</span>
                    <span className="text-sm font-bold text-slate-800">${Number(order.baseAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm font-medium text-slate-600">Platform Commission</span>
                    <span className="text-sm font-bold text-slate-800 text-red-600">+ ${Number(order.commissionAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-slate-50 px-4 rounded-sm">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-800">Final Total Due</span>
                    <span className="text-xl font-black text-blue-600">${Number(order.finalAmount || 0).toLocaleString()}</span>
                  </div>
               </div>
            </Card>

            <Card title="Payment & Settlement History">
               <div className="admin-table-container">
                  <table className="admin-table admin-table-striped">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Amount</th>
                        <th>Provider</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!order.payments || order.payments.length === 0 ? (
                        <tr><td colSpan={5} className="py-6 text-center text-[10px] font-bold text-slate-400 uppercase">No payments recorded.</td></tr>
                      ) : (
                        order.payments.map((p: any) => (
                          <tr key={p.id}>
                            <td className="text-xs font-mono">{p.id?.substring(0, 10) || 'N/A'}...</td>
                            <td className="font-bold">${Number(p.amount || 0).toLocaleString()}</td>
                            <td className="text-[10px] font-black uppercase text-slate-500">{p.provider}</td>
                            <td className="text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td><span className={`badge ${p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </Card>
          </div>

          {/* Sidebar Actions & Info */}
          <div className="space-y-6">
            <div className={`p-6 border-l-4 rounded-sm shadow-sm ${pendingAmount > 0 ? 'bg-red-50 border-red-600' : 'bg-green-50 border-green-600'}`}>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Settlement Balance</p>
               <h3 className={`text-3xl font-black mt-1 ${pendingAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                 ${pendingAmount.toLocaleString()}
               </h3>
               <p className="text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-50">Pending from customer</p>
               
               {pendingAmount > 0 && (
                 <Button className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs" onClick={() => {
                    setCashAmount(pendingAmount.toString());
                    setIsCashModalOpen(true);
                  }}>
                   <DollarSign size={14} className="mr-2" /> Record Cash Payment
                 </Button>
               )}
            </div>

            <Card title="Admin Remarks">
               <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Staff Notes Log</p>
                    <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                      {order.adminRemarks || 'No internal staff remarks added for this order.'}
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <textarea 
                      value={adminRemark}
                      onChange={(e) => setAdminRemark(e.target.value)}
                      placeholder="Add staff note..."
                      className="admin-input min-h-[80px]"
                    />
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full text-[10px] font-black tracking-widest uppercase py-2"
                      onClick={() => updateRemarksMutation.mutate(adminRemark)}
                      disabled={!adminRemark.trim()}
                      isLoading={updateRemarksMutation.isPending}
                    >
                      Append Remarks
                    </Button>
                  </div>
               </div>
            </Card>

                         <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                   <div className="flex items-center gap-3">
                      <Truck className="text-blue-600 animate-bounce" size={20} />
                      <div>
                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Logistics & Shipping Log</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Real-time Fulfillment Tracking</p>
                      </div>
                   </div>
                   {order.shipping && (
                     <span className={`badge ${
                       order.shipping.status === 'DELIVERED' 
                         ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold' 
                         : order.shipping.status === 'DISPATCHED' || order.shipping.status === 'IN_TRANSIT'
                           ? 'bg-blue-50 text-blue-700 border border-blue-100 font-bold'
                           : 'bg-amber-50 text-amber-700 border border-amber-100 font-bold'
                     } text-[9px] px-2.5 py-1 font-black tracking-widest rounded-sm`}>
                       {order.shipping.status}
                     </span>
                   )}
                </div>

                {/* Logistics Metadata */}
                {order.shipping && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-sm text-[11px] font-medium text-slate-650 font-bold">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Carrier Provider</span>
                      <span className="font-bold text-slate-800">{order.shipping.carrier}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tracking ID</span>
                      <span className="font-mono font-bold text-slate-800">{order.shipping.trackingNumber}</span>
                    </div>
                  </div>
                )}

                {/* Timeline Events List */}
                <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                   {/* Step 1: Order Paid & Settled */}
                   <div className="flex gap-3 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 border border-emerald-150 shadow-sm"><CheckCircle2 className="text-white" size={12} /></div>
                      <div>
                         <p className="text-xs font-bold text-slate-850">Order Settled (Payment Cleared)</p>
                         <p className="text-[10px] text-slate-400 font-medium">Order successfully completed and verified.</p>
                      </div>
                   </div>

                   {/* Dynamic Database Tracking Events */}
                   {order.shipping?.trackings && order.shipping.trackings.length > 0 ? (
                     order.shipping.trackings.map((event: any) => (
                       <div key={event.id} className="flex gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm"><Truck className="text-white" size={11} /></div>
                          <div>
                             <p className="text-xs font-bold text-slate-850">{event.description}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                               <p className="text-[10px] text-slate-400 font-medium">{new Date(event.eventDate).toLocaleString()}</p>
                               {event.location && (
                                 <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">{event.location}</span>
                               )}
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     /* Awaiting Dispatch State */
                     <div className="flex gap-3 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200"><Clock className="text-slate-400 animate-spin-slow" size={12} /></div>
                        <div>
                           <p className="text-xs font-bold text-slate-450">Logistics Dispatch Pending</p>
                           <p className="text-[10px] text-slate-350">Ready for carrier pick up and dispatch.</p>
                        </div>
                     </div>
                   )}
                </div>

                {/* Action Interactive Buttons for Delivery */}
                <div className="pt-2 border-t border-slate-100">
                  {order.status === 'FULLY_PAID' && !order.shipping && (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs py-3"
                      onClick={() => dispatchShipmentMutation.mutate()}
                      isLoading={dispatchShipmentMutation.isPending}
                    >
                      <Truck size={14} className="mr-2" /> Dispatch Delivery Logistics
                    </Button>
                  )}

                  {order.status === 'SHIPPED' && order.shipping?.status === 'DISPATCHED' && (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs py-3 shadow-md shadow-emerald-100"
                      onClick={openDeliveryHandoverModal}
                    >
                      <CheckCircle2 size={14} className="mr-2" /> Confirm Safe Delivery
                    </Button>
                  )}

                  {order.status === 'DELIVERED' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm text-emerald-800 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 select-none">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Vehicle Handed Over & Completed
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title="Record Cash Settlement"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={() => setIsCashModalOpen(false)} className="text-xs uppercase font-black tracking-widest py-2 px-4">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => markCashMutation.mutate({ amount: Number(cashAmount) })} isLoading={markCashMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase font-black tracking-widest py-2 px-5 shadow-sm shadow-emerald-100 transition-all">
              Confirm Receipt
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* Glowing Icon & Header */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm mb-3">
              <DollarSign className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-base font-black text-slate-850 tracking-tight">Physically Received Balance</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-[260px]">
              Confirm physical receipt of outstanding COD cash balance from the customer.
            </p>
          </div>

          {/* Verification Banner */}
          <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-lg text-amber-800 text-xs leading-relaxed flex gap-3 shadow-xs">
            <span className="text-sm select-none">⚠️</span>
            <div>
              <p className="font-bold mb-0.5 text-amber-900">Physical Verification Required</p>
              <p className="opacity-90">Please ensure you have physically counted and confirmed the cash before proceeding. This action updates order status immediately.</p>
            </div>
          </div>

          {/* Locked Amount Ledger */}
          <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-lg p-5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Cash to Settlement (Locked)</label>
             <div className="relative mt-1">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-800 font-black text-xl">$</div>
               <input 
                 type="number" 
                 value={cashAmount} 
                 disabled
                 className="w-full pl-8 pr-3 py-3 border border-slate-200 bg-white text-slate-800 rounded-md cursor-not-allowed text-xl font-black focus:outline-none shadow-xs"
               />
             </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Confirm Safe Handover"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={() => setIsDeliveryModalOpen(false)} className="text-xs uppercase font-black tracking-widest py-2 px-4">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => markDeliveredMutation.mutate({ receiverName, receiverPhone, isRepresentative })} 
              isLoading={markDeliveredMutation.isPending} 
              disabled={!receiverName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase font-black tracking-widest py-2 px-5 shadow-sm shadow-emerald-100 transition-all"
            >
              Confirm Handover
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          {/* Glowing Delivery Icon Header */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm mb-3">
              <Truck className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-base font-black text-slate-850 tracking-tight">Handover Verification</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-[260px]">
              Confirm safe physical handover of the vehicle and trigger delivery confirmation email to the bidder.
            </p>
          </div>

          {/* Receiver Option Cards */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Who is taking delivery?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRepresentative(false);
                  setReceiverName(order?.buyer?.name || order?.buyer?.email || '');
                  setReceiverPhone(order?.buyer?.phone || '');
                }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  !isRepresentative
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <User className={`w-4 h-4 ${!isRepresentative ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {!isRepresentative && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
                <div className="text-xs font-black text-slate-850">Bidder (Self)</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[120px]">{order?.buyer?.name || 'Primary Account'}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRepresentative(true);
                  setReceiverName('');
                  setReceiverPhone('');
                }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isRepresentative
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Truck className={`w-4 h-4 ${isRepresentative ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {isRepresentative && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
                <div className="text-xs font-black text-slate-850">Representative</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Other authorized person</div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Receiver Full Name</label>
              <Input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Enter full name of the receiver..."
                className="w-full text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Receiver Phone Number (Optional)</label>
              <Input
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="Enter receiver contact number..."
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Email Notification Alert Banner */}
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-800 text-[10px] font-medium leading-relaxed flex gap-2">
            <span className="text-xs select-none">📨</span>
            <div>
              An automated receipt of physical delivery will be instantly emailed to the bidder at <strong className="font-bold">{order?.buyer?.email}</strong>.
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
