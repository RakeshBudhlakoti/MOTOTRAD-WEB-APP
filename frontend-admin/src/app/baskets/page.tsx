'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createAdminService } from '@/services/admin.service';
import { ShoppingBag, Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const basketsService = createAdminService('baskets');

export default function BasketsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [basketToDelete, setBasketToDelete] = useState<any>(null);

  const { data: basketsData, isLoading } = useQuery({
    queryKey: ['admin-baskets', searchTerm, statusFilter, page],
    queryFn: () => basketsService.findAll({
      search: searchTerm || undefined,
      page,
      limit: 12,
      isActive: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => basketsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-baskets'] });
      toast.success('Bucket deleted. Products unassigned.');
      setBasketToDelete(null);
    },
    onError: (err: any) => toast.error('Failed to delete bucket'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => basketsService.patch(`${id}/toggle-status`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-baskets'] });
      toast.success('Status updated');
    },
  });

  const baskets = basketsData?.items || [];
  const meta = basketsData?.meta;

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-slate-200 text-slate-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Buckets</h1>
              <p className="text-xs text-slate-500 font-medium">
                Group products into event/location collections (e.g. Auction in Miami).
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/baskets/add')} className="uppercase tracking-widest text-xs font-black py-2.5">
            <Plus className="w-4 h-4 mr-2" /> Create Bucket
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 pb-px overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${statusFilter === tab.value ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.label}
              {statusFilter === tab.value && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search buckets..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="admin-input pl-9"
            />
          </div>
        </Card>

        {/* Table */}
        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th className="w-[80px]">Image</th>
                  <th>Bucket Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={6} rows={6} />
                ) : baskets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No buckets found. Create your first bucket!
                    </td>
                  </tr>
                ) : (
                  baskets.map((basket: any) => (
                    <tr key={basket.id}>
                      <td>
                        <div className="w-12 h-12 rounded-sm bg-slate-100 border border-slate-200 overflow-hidden">
                          {basket.image ? (
                            <img src={basket.image} alt={basket.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={18} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <p className="font-bold text-slate-800 text-sm">{basket.name}</p>
                        {basket.description && (
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">{basket.description}</p>
                        )}
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-500 bg-slate-55 px-2 py-0.5 border border-slate-100 rounded-sm">
                          {basket.slug}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-black text-slate-600">
                          {basket._count?.products ?? 0}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${basket.isActive ? 'badge-success' : 'badge-secondary'}`}>
                            {basket.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => toggleMutation.mutate(basket.id)}
                            className={`transition-colors ${basket.isActive ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-slate-400'}`}
                          >
                            {basket.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => router.push(`/baskets/${basket.id}/edit`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setBasketToDelete(basket)}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4 border-t border-slate-100">
              {Array.from({ length: meta.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 text-xs font-bold rounded-sm transition-all ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={!!basketToDelete}
        onClose={() => setBasketToDelete(null)}
        onConfirm={() => deleteMutation.mutate(basketToDelete.id)}
        title="Delete Bucket"
        message={`Delete "${basketToDelete?.name}"? All ${basketToDelete?._count?.products ?? 0} assigned products will be unassigned automatically.`}
        confirmText="Delete Bucket"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
