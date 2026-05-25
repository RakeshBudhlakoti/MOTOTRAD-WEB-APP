'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuctionCard from '@/components/features/AuctionCard';
import { auctionService } from '@/services/auction.service';
import { categoryService } from '@/services/catalog.service';
import { useAppQuery } from '@/hooks/useApp';

function PastAuctionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const sortByParam = searchParams.get('sortBy') || 'endTime'; // Default to end time for past auctions
  const sortOrderParam = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  
  const [page, setPage] = useState(1);

  // Fetch categories for the dropdown with counts
  const { data: categoriesData } = useAppQuery(['categories-past'], () => categoryService.findAll({ includePastCount: true }));
  const categoriesRaw = (categoriesData as any)?.items || (Array.isArray(categoriesData) ? categoriesData : []);
  const categories = categoriesRaw.filter((cat: any) => cat.isActive !== false);

  // Fetch past auctions (status: PAST)
  const { data: auctionsData, isLoading } = useAppQuery(['past-auctions', page, categoryFilter], () => 
    auctionService.findAll({ 
        page, 
        limit: 12, 
        status: 'PAST',
        category: categoryFilter || undefined,
        sortBy: 'endTime', // Force recently ended for past auctions
        sortOrder: 'desc'
    })
  );

  const auctions = (auctionsData as any)?.items || [];
  const totalItems = (auctionsData as any)?.meta?.total || (auctionsData as any)?.meta?.totalItems || 0;
  const totalPages = (auctionsData as any)?.meta?.lastPage || (auctionsData as any)?.meta?.totalPages || 1;

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/past-auctions?${params.toString()}`);
  };

  return (
    <main className="flex-1 w-full animate-fade-in bg-[#F8FAFC] py-8 lg:py-16">
      <div className="container">
        {/* Page Header */}
        <div className="mb-10 lg:mb-16">
          <span className="text-primary text-[10px] font-black uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
            Sales History
          </span>
          <h1 className="text-[2.2rem] lg:text-[3.2rem] font-black text-[#0F172A] tracking-tight leading-tight mb-3">
            {categoryFilter ? (
              (() => {
                const catName = categoryFilter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const words = catName.split(' ');
                const lastWord = words.pop();
                return (
                  <>
                    Past Auctions: {words.join(' ')}{words.length > 0 ? ' ' : ''}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">{lastWord}</span>
                  </>
                );
              })()
            ) : (
              <>
                Past <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Auctions</span>
              </>
            )}
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 rounded-full mt-4 mb-4" />
          <p className="mt-4 text-[#475569] text-sm lg:text-base font-medium max-w-[600px] leading-relaxed">
            Explore our successful sales and historical auction results. See what items have recently found new homes.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-5 lg:p-8 mb-8 lg:mb-12 shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                    <select 
                        value={categoryFilter}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="appearance-none w-full bg-[#F8FAFC] border-2 border-transparent hover:border-primary/20 rounded-xl px-10 py-3.5 font-bold text-[#111] outline-none cursor-pointer transition-all pr-12 min-w-[280px]"
                    >
                        <option value="">All Categories ({totalItems})</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.slug}>
                              {cat.name} ({cat._count?.pastAuctions || 0})
                            </option>
                        ))}
                    </select>
                    <i className="fas fa-th-large absolute left-4 top-1/2 -translate-y-1/2 text-primary/50"></i>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#AAA] pointer-events-none"></i>
                </div>
            </div>

            <div className="text-[1rem] text-[#888] font-bold bg-[#F8FAFC] sm:bg-transparent px-6 py-3 rounded-xl sm:p-0 w-full sm:w-auto text-center sm:text-right">
                Found <span className="text-primary font-black">{totalItems}</span> historical auctions
            </div>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 min-h-[500px]">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-[420px] bg-white rounded-[25px] animate-pulse border border-[#F1F5F9]"></div>
            ))
          ) : (
            auctions.map((auction: any) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))
          )}
          
          {!isLoading && auctions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 lg:py-32 bg-white rounded-[35px] border-2 border-dashed border-[#F1F5F9] px-6 text-center">
                <div className="w-20 h-20 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-history text-3xl text-[#DDD]"></i>
                </div>
                <h3 className="text-2xl font-black text-[#111] mb-2">No past auctions found</h3>
                <p className="text-[#888] font-medium max-w-[320px] leading-relaxed">
                    Check back later to see our successfully closed auctions and results.
                </p>
                <button 
                    onClick={() => router.push('/')}
                    className="mt-8 bg-[#111] text-white px-10 py-4 rounded-xl font-black shadow-lg hover:bg-primary hover:-translate-y-1 transition-all active:scale-95"
                >
                    View Live Auctions
                </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4 mt-16 lg:mt-24">
              {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('page', (i + 1).toString());
                        router.push(`/past-auctions?${params.toString()}`);
                    }}
                    className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-black text-base lg:text-lg transition-all duration-300 ${page === i + 1 ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-white text-[#888] border-2 border-[#F1F5F9] hover:border-primary hover:text-primary shadow-sm'}`}
                  >
                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                  </button>
              ))}
            </div>
        )}
      </div>
    </main>
  );
}

export default function PastAuctionsPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 w-full bg-[#F8FAFC] py-8 lg:py-16 animate-pulse">
        <div className="container">
          <div className="h-44 bg-white rounded-2xl mb-8 border border-[#F1F5F9]"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-[420px] bg-white rounded-[25px] border border-[#F1F5F9]"></div>
            ))}
          </div>
        </div>
      </main>
    }>
      <PastAuctionsContent />
    </Suspense>
  );
}

