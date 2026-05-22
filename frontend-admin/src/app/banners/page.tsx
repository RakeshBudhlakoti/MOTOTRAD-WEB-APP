'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Table from '@/components/common/Table';
import { bannersService } from '@/services/admin.service';
import { 
  Plus, Search, Edit, Trash, 
  Image as ImageIcon, Link as LinkIcon, 
  Layout, CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Drawer from '@/components/common/Drawer';

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['banners', { page, search }],
    queryFn: () => bannersService.findAll({ page, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: bannersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted');
    },
  });

  const columns = [
    {
      header: 'IMAGE',
      accessor: 'imageUrl',
      render: (row: any) => (
        <div className="w-32 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
           {row.imageUrl ? (
             <img src={row.imageUrl} alt="" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center">
               <ImageIcon className="w-5 h-5 text-slate-300" />
             </div>
           )}
        </div>
      ),
    },
    {
      header: 'TITLE',
      accessor: 'title',
      render: (row: any) => (
        <div className="flex flex-col">
          <p className="font-bold text-[#111] text-[0.9rem] leading-none mb-1">{row.title}</p>
          <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">{row.subtitle || 'NO SUBTITLE'}</p>
        </div>
      ),
    },
    {
      header: 'LINK',
      accessor: 'link',
      render: (row: any) => (
        <div className="flex items-center gap-2 text-blue-500 font-bold text-[0.8rem]">
           <LinkIcon className="w-3.5 h-3.5" />
           <span className="truncate max-w-[150px]">{row.link || '#'}</span>
        </div>
      ),
    },
    {
      header: 'PLACEMENT',
      accessor: 'placement',
      render: (row: any) => (
        <span className="bg-slate-50 text-slate-600 text-[0.65rem] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-100">
          {row.placement || 'HOME_TOP'}
        </span>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'isActive',
      render: (row: any) => (
        <span className={`text-[0.75rem] font-black uppercase tracking-widest ${row.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'ACTIONS',
      accessor: 'id',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
            onClick={() => {
              setSelectedBanner(row);
              setIsDrawerOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors"
            onClick={() => {
              if (confirm('Delete this banner?')) deleteMutation.mutate(row.id);
            }}
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[1.8rem] font-black text-[#111] uppercase tracking-tight">Banners</h1>
            <button 
              className="px-4 py-1.5 rounded-lg border-2 border-[#E2E8F0] text-[0.7rem] font-black text-slate-400 uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
              onClick={() => {
                setSelectedBanner(null);
                setIsDrawerOpen(true);
              }}
            >
              Add New
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6 text-[0.75rem] font-black uppercase tracking-widest border-b border-slate-100 flex-1">
              <button className="pb-2 border-b-2 border-primary text-[#111]">Active Banners (0)</button>
              <button className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600 transition-all">Archived (0)</button>
           </div>
           
           <div className="relative w-64 group ml-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
               type="text" 
               placeholder="Search banners..." 
               className="w-full pl-11 pr-4 py-2.5 bg-white rounded-2xl border border-[#F1F5F9] text-[0.85rem] font-medium outline-none focus:border-primary/20 transition-all shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        {/* Table Wrapper */}
        <div className="admin-table-container">
          <Table 
            columns={columns} 
            data={(data as any)?.items || []} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBanner ? 'Edit Banner' : 'Add New Banner'}
      >
        <div className="p-8 space-y-8">
           <div className="space-y-3">
              <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Banner Image</label>
              <div className="border-2 border-dashed border-slate-100 rounded-[32px] h-40 flex flex-col items-center justify-center bg-[#F8FAFC] group cursor-pointer hover:border-primary/20 transition-all">
                 <UploadIcon className="w-6 h-6 text-slate-400 mb-2" />
                 <p className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest">Select Image</p>
              </div>
           </div>
           
           <div className="space-y-3">
              <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Banner Title</label>
              <input type="text" className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none focus:border-primary/20 transition-all" placeholder="E.g. Summer Special Sale" />
           </div>

           <div className="space-y-3">
              <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Link URL</label>
              <input type="text" className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none focus:border-primary/20 transition-all" placeholder="https://..." />
           </div>

           <button className="w-full py-4 bg-[#213345] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#1a2837] transition-all shadow-xl">Save Banner</button>
        </div>
      </Drawer>
    </DashboardLayout>
  );
}

function UploadIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  );
}
