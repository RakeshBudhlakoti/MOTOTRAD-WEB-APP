'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { productsService } from '@/services/admin.service';
import { 
  Package, Plus, Search, Edit, Trash2, 
  ExternalLink, CheckCircle2, XCircle, 
  Clock, AlertCircle, History, Trophy, Eye, EyeOff,
  Star
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';
import Pagination from '@/components/common/Pagination';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['admin-products', page, searchTerm],
    queryFn: () => productsService.findAll({ page, limit: 10, search: searchTerm }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product moved to trash');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error deleting product')
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string, isFeatured: boolean }) => 
      productsService.update(id, { isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product featured status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating product')
  });

  const handleToggleFeatured = (product: any) => {
    toggleFeaturedMutation.mutate({ id: product.id, isFeatured: !product.isFeatured });
  };

  const handleDelete = (product: any) => {
    Swal.fire({
      title: 'Delete Product?',
      text: `Are you sure you want to delete "${product.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(product.id);
      }
    });
  };

  const getAuctionStatusBadge = (auction: any) => {
    if (!auction) return <span className="text-[10px] text-slate-300 font-bold uppercase">No Auction</span>;
    
    switch (auction.status) {
      case 'ACTIVE': return (
        <div className="flex flex-col items-start gap-1">
          <span className="badge badge-success ring-1 ring-green-100">Live Now</span>
          <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
             <History size={10} className="text-blue-400" /> {auction.bidCount || 0} Bids
          </span>
        </div>
      );
      case 'PENDING': return <span className="badge badge-secondary ring-1 ring-slate-100">Pending</span>;
      case 'ENDED_SOLD': return <span className="badge badge-primary ring-1 ring-blue-100">Sold</span>;
      case 'ENDED_UNSOLD': return <span className="badge badge-danger ring-1 ring-red-100">Unsold</span>;
      case 'CANCELLED': return <span className="badge badge-danger ring-1 ring-red-100">Cancelled</span>;
      default: return <span className="badge badge-secondary">{auction.status?.toLowerCase()}</span>;
    }
  };

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price || 0));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white border border-slate-200 text-slate-400"><Package size={20} /></div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Product Inventory</h1>
                <p className="text-xs text-slate-500 font-medium">Manage vehicles, auctions, and stock levels.</p>
             </div>
          </div>
          <Button 
            onClick={() => router.push('/products/add')}
            className="uppercase tracking-widest text-xs font-black py-2.5"
          >
            <Plus className="w-4 h-4 mr-2" /> List New Item
          </Button>
        </div>

        {error && (
           <div className="bg-red-50 border border-red-200 text-red-600 p-4 flex items-center gap-3 rounded-sm">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">Failed to load inventory.</p>
           </div>
        )}

        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by product name, SKU, or seller..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="admin-input pl-9"
            />
          </div>
        </Card>

        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th className="w-[50px] text-center">#</th>
                  <th className="w-[80px]">Image</th>
                  <th>Product Details</th>
                  <th className="text-center">Stock</th>
                  <th>Auction</th>
                  <th>Category</th>
                  <th className="text-center">Featured</th>
                  <th className="text-center">Live</th>
                  <th className="text-center">Visible</th>
                  <th className="text-right">Price</th>
                  <th className="text-center">Won</th>
                  <th className="text-center">Relisted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={13} rows={5} />
                ) : !productsData?.items || productsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  productsData?.items?.map((product: any, index: number) => {
                    const auction = product.auctions?.[0];
                    const isLive = auction?.status === 'ACTIVE';
                    const isVisible = product.status === 'ACTIVE' || product.status === 'IN_AUCTION';
                    const isWon = auction?.status === 'ENDED_SOLD';
                    const isRelisted = (product.auctions?.length || 0) > 1;

                    return (
                      <tr key={product.id}>
                        <td className="text-center text-[10px] font-black text-slate-300">
                           {(page - 1) * 10 + index + 1}
                        </td>
                        <td>
                          <div className="w-12 h-12 rounded-sm bg-slate-100 border border-slate-200 overflow-hidden relative group">
                             <img 
                               src={product.media?.[0]?.url || 'https://placehold.co/100x100?text=No+Image'} 
                               alt="" 
                               className="w-full h-full object-cover transition-transform group-hover:scale-110"
                             />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink size={12} className="text-white" />
                             </div>
                          </div>
                        </td>
                        <td>
                          <div className="max-w-[200px]">
                             <p className="font-bold text-slate-800 leading-tight truncate" title={product.title}>{product.title}</p>
                             <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                               <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">SKU: {product.sku || 'N/A'}</span>
                               {product.buyNowDisabled && (
                                 <span className="badge badge-danger ring-1 ring-red-100 uppercase text-[8px] font-black tracking-wider px-1.5 py-0.5">
                                   Active Bidding
                                 </span>
                               )}
                             </div>
                          </div>
                        </td>
                        <td className="text-center">
                           <span className={`text-xs font-black ${product.quantity > 0 ? 'text-slate-600' : 'text-red-500'}`}>
                              {product.quantity}
                           </span>
                        </td>
                        <td>
                           {getAuctionStatusBadge(auction)}
                        </td>
                        <td>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-sm">
                              {product.category?.name || 'Uncategorized'}
                           </span>
                        </td>
                        <td className="text-center">
                           <button 
                             onClick={() => handleToggleFeatured(product)}
                             className="text-amber-500 hover:scale-110 transition-all focus:outline-none flex items-center justify-center mx-auto"
                             title={product.isFeatured ? "Unfeature Product" : "Feature Product"}
                           >
                             {product.isFeatured ? (
                               <Star size={18} fill="#F59E0B" stroke="#F59E0B" />
                             ) : (
                               <Star size={18} className="text-slate-300 hover:text-amber-400" />
                             )}
                           </button>
                        </td>
                        <td className="text-center">
                           {isLive ? (
                             <div className="flex justify-center"><CheckCircle2 className="text-green-500" size={16} /></div>
                           ) : (
                             <div className="flex justify-center"><Clock className="text-slate-300" size={16} /></div>
                           )}
                        </td>
                        <td className="text-center">
                           {isVisible ? (
                             <div className="flex justify-center"><Eye className="text-blue-500" size={16} /></div>
                           ) : (
                             <div className="flex justify-center"><EyeOff className="text-slate-300" size={16} /></div>
                           )}
                        </td>
                        <td className="text-right">
                           <p className="text-xs font-black text-slate-800">{formatPrice(auction?.startingBid || product.basePrice)}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Opening</p>
                        </td>
                        <td className="text-center">
                           {isWon ? (
                             <div className="flex justify-center"><Trophy className="text-amber-500" size={16} /></div>
                           ) : (
                             <div className="flex justify-center"><XCircle className="text-slate-200" size={16} /></div>
                           )}
                        </td>
                        <td className="text-center">
                           {isRelisted ? (
                             <div className="flex justify-center flex-col items-center">
                                <History className="text-blue-400" size={16} />
                                <span className="text-[8px] font-black text-blue-500 mt-0.5">x{product.auctions?.length}</span>
                             </div>
                           ) : (
                             <div className="flex justify-center"><XCircle className="text-slate-200" size={16} /></div>
                           )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" 
                              title="Edit Product"
                            >
                               <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" 
                              title="Delete Product"
                            >
                               <Trash2 size={14} />
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
          
          {!isLoading && productsData?.meta && (
            <Pagination 
              currentPage={page}
              totalPages={productsData.meta.lastPage || 1}
              onPageChange={setPage}
              totalItems={productsData.meta.total}
              itemsPerPage={10}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
