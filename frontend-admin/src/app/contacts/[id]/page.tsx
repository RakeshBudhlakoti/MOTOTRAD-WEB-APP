'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { contactsService } from '@/services/admin.service';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  RotateCcw,
  Check
} from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [replyText, setReplyText] = useState('');

  // Fetch inquiry details
  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact-details', id],
    queryFn: () => contactsService.findOne(id),
    enabled: !!id,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (reply: string) => contactsService.reply(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-details', id] });
      toast.success('Reply submitted and email sent to user successfully!');
      setReplyText('');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to submit reply');
    }
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: (status: string) => contactsService.updateStatus(id, status),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-details', id] });
      toast.success(`Ticket status updated to ${newStatus}`);
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate(replyText);
  };

  const handleUpdateStatus = (status: string) => {
    statusMutation.mutate(status);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Support Inquiry Details...</div>
      </DashboardLayout>
    );
  }

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="p-20 text-center">
          <h2 className="text-lg font-bold text-slate-700">Inquiry Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">The support inquiry you requested does not exist or has been deleted.</p>
          <Link href="/contacts" className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">
            Back to Inquiries Ledger
          </Link>
        </div>
      </DashboardLayout>
    );
  }

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
        
        {/* Back Link & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/contacts" className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Ticket #{contact.id.slice(0, 8).toUpperCase()}</h1>
                {getStatusBadge(contact.status)}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Review user inquiry details, status logs, and draft a dynamic SMTP email response.</p>
            </div>
          </div>

          {/* Quick status controls */}
          <div className="flex flex-wrap gap-1.5">
            {contact.status === 'UNREAD' && (
              <button
                onClick={() => handleUpdateStatus('READ')}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all rounded-sm shadow-sm"
              >
                <Check size={12} /> Mark Read
              </button>
            )}
            {contact.status === 'READ' && (
              <button
                onClick={() => handleUpdateStatus('UNREAD')}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:border-slate-500 hover:text-slate-700 transition-all rounded-sm shadow-sm"
              >
                <RotateCcw size={12} /> Mark Unread
              </button>
            )}
            {contact.status !== 'CLOSED' && (
              <button
                onClick={() => handleUpdateStatus('CLOSED')}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all rounded-sm shadow-sm"
              >
                <XCircle size={12} /> Close Ticket
              </button>
            )}
            {contact.status === 'CLOSED' && (
              <button
                onClick={() => handleUpdateStatus('READ')}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all rounded-sm shadow-sm"
              >
                <RotateCcw size={12} /> Reopen Ticket
              </button>
            )}
          </div>
        </div>

        {/* main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: User and Message Details */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* Sender profile card */}
            <Card title="Sender Profile">
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 leading-tight">{contact.name}</h3>
                    <span className="text-[10px] text-green-600 font-extrabold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-sm mt-1 inline-block">Verified Guest</span>
                  </div>
                </div>

                {/* Sender Metadata List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <Mail size={14} className="text-slate-300 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline truncate">{contact.email}</a>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <Phone size={14} className="text-slate-300 shrink-0" />
                    <span>{contact.phone || 'No phone number provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <Calendar size={14} className="text-slate-300 shrink-0" />
                    <span>Submitted: {new Date(contact.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Original message card */}
            <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between grow shadow-sm">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-2 block">Customer Inquiry Message</span>
                <h4 className="font-extrabold text-slate-800 text-base leading-snug uppercase border-b border-slate-100 pb-3">{contact.subject}</h4>
                <div className="mt-4 p-4 bg-slate-50 border-l-4 border-blue-500 rounded-sm italic text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  "{contact.message}"
                </div>
              </div>

              {/* Bottom system status info */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Database Sync Log</span>
                <span className="text-green-500 flex items-center gap-1 font-black"><Check size={12} /> Active</span>
              </div>
            </div>

          </div>

          {/* Right Column: Reply History and Compose Box */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Reply Log history */}
            <Card title="Response History Log">
              {contact.adminReply ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50/50 border border-green-100 rounded-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-green-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-600 text-white flex items-center justify-center font-bold text-[10px]">A</div>
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{contact.repliedBy || 'Administrator'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(contact.repliedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                      "{contact.adminReply}"
                    </p>
                  </div>
                  <div className="text-center py-2 bg-slate-50 border border-slate-200">
                    <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">SMTP Outgoing Email Dispatched Successfully</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">No Response Logged Yet</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Draft a custom response email below to reply to this customer.</p>
                </div>
              )}
            </Card>

            {/* Compose Reply Form */}
            <Card title={contact.adminReply ? "Send Follow-up Email" : "Compose Support Reply"}>
              <form onSubmit={handleSendReply} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                    Message Body <span className="text-primary">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Dear client, thank you for reaching out..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                    className="admin-input font-medium text-xs resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={replyMutation.isPending || !replyText.trim()}
                    className="px-6 py-2.5 uppercase tracking-wider text-[10px] font-black"
                  >
                    {replyMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-1.5"></i> Sending Reply...
                      </>
                    ) : (
                      <>
                        <Send size={12} className="mr-1.5" /> Dispatch SMTP Email
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>

          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}
