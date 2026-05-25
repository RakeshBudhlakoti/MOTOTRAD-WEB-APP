'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { categoriesService } from '@/services/admin.service';
import { Layers, Plus, Search, Edit, Trash2, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection states for deletion
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  // Load all categories for list
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories', searchTerm],
    queryFn: () => categoriesService.findAll({ search: searchTerm })
  });

  const handleOpenDelete = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] });
      toast.success('Category deleted successfully!');
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'An error occurred while deleting.');
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (category: any) => categoriesService.update(category.id, { isFeatured: !category.isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] });
      toast.success('Featured status updated!');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to update featured status.');
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white border border-slate-200 text-slate-400"><Layers size={20} /></div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Product Categories</h1>
                <p className="text-xs text-slate-500 font-medium">Organize your inventory with primary taxonomy groups.</p>
             </div>
          </div>
          <Link href="/categories/add">
            <Button className="uppercase tracking-widest text-xs font-black py-2.5">
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-9"
            />
          </div>
        </Card>

        {/* Table List */}
        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th className="w-[80px]">Icon</th>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Product Count</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : !categories?.items || categories.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No categories defined.
                    </td>
                  </tr>
                ) : (
                  categories?.items?.map((cat: any) => (
                    <tr key={cat.id}>
                      <td>
                        <div className="w-10 h-10 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                           {cat.imageUrl ? <img src={cat.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={18} />}
                        </div>
                      </td>
                      <td>
                        <p className="font-bold text-slate-800 leading-tight">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {cat.parent ? `Parent: ${cat.parent.name} • ` : ''}
                          {cat.description || 'No description provided.'}
                        </p>
                      </td>
                      <td>
                        <span className="text-xs font-mono bg-slate-50 px-1.5 py-0.5 border border-slate-100 text-slate-500">{cat.slug}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${cat.isActive !== false ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {cat.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${cat.isFeatured ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                            {cat.isFeatured ? 'Featured' : 'Standard'}
                          </span>
                          <button
                            onClick={() => toggleFeaturedMutation.mutate(cat)}
                            className={`transition-colors ${cat.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'}`}
                            title="Toggle Featured Homepage Visibility"
                          >
                            {cat.isFeatured ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        </div>
                      </td>
                      <td>
                         <span className="text-xs font-black text-slate-700">{cat._count?.products || 0}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link 
                            href={`/categories/${cat.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit Category"
                          >
                            <Edit size={14} />
                          </Link>
                          <button 
                            onClick={() => handleOpenDelete(cat)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Category"
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
        </Card>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
        title="⚠️ Delete Category Permanently?"
        message={`Are you sure you want to delete the "${categoryToDelete?.name}" category? This action is highly destructive. Any products currently categorized under this will lose their relation, and this cannot be undone!`}
        confirmText="Confirm Delete"
        cancelText="Keep Category"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}


