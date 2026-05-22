'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { contactsService } from '@/services/admin.service';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Check, 
  RotateCcw,
  User
} from 'lucide-react';

const STATUSES = [
  { id: 'ALL', label: 'All Inquiries' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'READ', label: 'Read' },
  { id: 'REPLIED', label: 'Replied' },
  { id: 'CLOSED', label: 'Closed' },
];

export default function ContactsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch inquiries
  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts', page, search, statusFilter],
    queryFn: () => contactsService.findAll({ page, limit: 10, search, status: statusFilter }),
  });

  const inquiries = data?.items || [];
  const meta = data?.meta || { total: 0, lastPage: 1 };

  // Update Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      contactsService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-details', variables.id] });
      toast.success(`Inquiry status updated to ${variables.status}`);
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleUpdateStatus = (id: string, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 rounded-sm">Unread</span>;
      case 'READ':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 rounded-sm">Read</span>;
      case 'REPLIED':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-100 rounded-sm">Replied</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 rounded-sm">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 rounded-sm">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-slate-200 text-slate-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Customer Inquiries</h1>
              <p className="text-xs text-slate-500 font-medium">Manage support tickets, questions, and replies.</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by name, email, subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-input pl-9 w-full"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1">
            {STATUSES.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setStatusFilter(t.id);
                  setPage(1);
                }}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                  statusFilter === t.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

        </div>

        {/* inquiries Table */}
        <Card title="Inquiries Ledger">
          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="p-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Inquiries Ledger...</div>
            ) : inquiries.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Sender Details</th>
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inquiries.map((inquiry: any) => (
                    <tr key={inquiry.id} className="hover:bg-slate-50 transition-all text-xs font-medium text-slate-600">
                      
                      {/* Sender details */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 text-sm">{inquiry.name}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail size={12} className="text-slate-300" /> {inquiry.email}
                          </span>
                          {inquiry.phone && (
                            <span className="text-[10px] text-slate-400">☎ {inquiry.phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-4 px-6 max-w-xs truncate">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-700 truncate">{inquiry.subject}</span>
                          <span className="text-[11px] text-slate-400 truncate">{inquiry.message}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {getStatusBadge(inquiry.status)}
                      </td>

                      {/* Created date */}
                      <td className="py-4 px-6 text-slate-400 font-bold text-[11px]">
                        {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Mark Read/Unread Quick Actions */}
                          {inquiry.status === 'UNREAD' && (
                            <button
                              onClick={() => handleUpdateStatus(inquiry.id, 'READ')}
                              title="Mark Read"
                              className="p-2 border border-slate-200 bg-white hover:border-blue-500 hover:text-blue-500 rounded-sm transition-all"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {inquiry.status === 'READ' && (
                            <button
                              onClick={() => handleUpdateStatus(inquiry.id, 'UNREAD')}
                              title="Mark Unread"
                              className="p-2 border border-slate-200 bg-white hover:border-slate-500 hover:text-slate-600 rounded-sm transition-all"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {/* Quick Close Ticket */}
                          {inquiry.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleUpdateStatus(inquiry.id, 'CLOSED')}
                              title="Close Ticket"
                              className="p-2 border border-slate-200 bg-white hover:border-red-500 hover:text-red-500 rounded-sm transition-all"
                            >
                              <XCircle size={14} />
                            </button>
                          )}

                          {/* Details Page Link */}
                          <Link href={`/contacts/${inquiry.id}`}>
                            <Button size="sm" variant="outline" className="px-3 text-[10px] font-black uppercase tracking-wider">
                              <Eye size={12} className="mr-1.5" /> Details
                            </Button>
                          </Link>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20">
                <Mail className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-slate-700">No support tickets found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try clearing search parameters or applying a different category status filter.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && meta.lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Page <span className="text-slate-800">{page}</span> of {meta.lastPage} ({meta.total} Total)
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-slate-200 hover:bg-slate-50 transition-all rounded-sm disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page === meta.lastPage}
                  onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                  className="p-2 border border-slate-200 hover:bg-slate-50 transition-all rounded-sm disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
