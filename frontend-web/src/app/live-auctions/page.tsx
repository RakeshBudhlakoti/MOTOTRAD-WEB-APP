'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuctionCard from '@/components/features/AuctionCard';
import { auctionService } from '@/services/auction.service';
import { categoryService, basketService } from '@/services/catalog.service';
import { useAppQuery } from '@/hooks/useApp';

function LiveAuctionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Filter Parameters
  const categoryFilter = searchParams.get('category') || '';
  const basketFilter = searchParams.get('basket') || '';
  const sortByParam = searchParams.get('sortBy') || 'featuredFirst';
  const pageParam = Number(searchParams.get('page') || '1');
  const searchFilter = searchParams.get('search') || '';

  // Fetch categories with active counts
  const { data: categoriesData } = useAppQuery(['categories-live-filters'], () => 
    categoryService.findAll({ includeActiveCount: true })
  );
  // Support both paginated structure and flat array fallback
  const categoriesRaw = (categoriesData as any)?.items || (Array.isArray(categoriesData) ? categoriesData : []);
  const categories = categoriesRaw.filter((cat: any) => cat.isActive !== false);

  // Fetch active baskets for filter
  const { data: basketsData } = useAppQuery(['baskets-live-filters'], () => 
    basketService.findAll({ isActive: 'true' })
  );
  const baskets = (basketsData as any)?.items || (Array.isArray(basketsData) ? basketsData : []);

  // Fetch live and upcoming auctions (status: LIVE_AND_UPCOMING)
  const { data: auctionsData, isLoading } = useAppQuery(
    ['live-auctions', pageParam, categoryFilter, basketFilter, sortByParam, searchFilter],
    () =>
      auctionService.findAll({
        page: pageParam,
        limit: 8,
        status: 'LIVE_AND_UPCOMING',
        category: categoryFilter || undefined,
        basket: basketFilter || undefined,
        sortBy: sortByParam || undefined,
        search: searchFilter || undefined,
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
    router.push(`/live-auctions?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/live-auctions?${params.toString()}`);
  };

  return (
    <main className="flex-1 w-full animate-fade-in bg-[#F8FAFC] py-8 lg:py-16">
      {/* Dynamic SEO Meta Title Tag */}
      <title>Live & Upcoming Auctions | Mototrad Marketplace</title>
      <meta name="description" content="Discover premium active auctions, live bidding opportunities, and upcoming vehicles, jewelry, and luxury assets on Mototrad." />

      <div className="container">
        {/* Page Header */}
        <div className="mb-10 lg:mb-16">
          <span className="text-primary text-[10px] font-black uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
            Premium Inventory
          </span>
          <h1 className="text-[2.2rem] lg:text-[3.2rem] font-black text-[#0F172A] tracking-tight leading-tight mb-3">
            {searchFilter ? (
              <>
                Search: <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">"{searchFilter}"</span>
              </>
            ) : categoryFilter ? (
              (() => {
                const catName = categoryFilter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const words = catName.split(' ');
                const lastWord = words.pop();
                return (
                  <>
                    Live Auctions: {words.join(' ')}{words.length > 0 ? ' ' : ''}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">{lastWord}</span>
                  </>
                );
              })()
            ) : (
              <>
                Live & Upcoming <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Auctions</span>
              </>
            )}
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 rounded-full mt-4 mb-4" />
          {searchFilter ? (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[#64748B] font-medium text-sm">Showing search results for keyword</span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black select-none">"{searchFilter}"</span>
              <button 
                onClick={() => handleFilterChange('search', '')} 
                className="text-xs text-red-500 hover:text-red-700 font-bold ml-2 underline"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <p className="mt-4 text-[#64748B] font-medium max-w-[650px] leading-relaxed">
              Bid live or secure buy-now options on curated collections of the world's most sought-after cars, timepieces, and masterpieces.
            </p>
          )}
        </div>

        {/* Filters Header Section */}
        <div className="bg-white rounded-2xl p-5 lg:p-8 mb-8 lg:mb-12 shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-[#F1F5F9] flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:w-auto grow max-w-5xl">
            {/* Category Filter */}
            <div className="relative w-full">
              <select 
                value={categoryFilter}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="appearance-none w-full bg-[#F8FAFC] border-2 border-transparent hover:border-primary/20 rounded-xl px-10 py-3.5 font-bold text-[#111] outline-none cursor-pointer transition-all pr-12 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name} ({cat._count?.products || cat.productsCount || 0})
                  </option>
                ))}
              </select>
              <i className="fas fa-th-large absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-sm"></i>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#AAA] pointer-events-none text-xs"></i>
            </div>

            {/* Basket/Event Filter */}
            <div className="relative w-full">
              <select 
                value={basketFilter}
                onChange={(e) => handleFilterChange('basket', e.target.value)}
                className="appearance-none w-full bg-[#F8FAFC] border-2 border-transparent hover:border-primary/20 rounded-xl px-10 py-3.5 font-bold text-[#111] outline-none cursor-pointer transition-all pr-12 text-sm"
              >
                <option value="">All Baskets / Events</option>
                {baskets.map((b: any) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
              <i className="fas fa-shopping-basket absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-sm"></i>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#AAA] pointer-events-none text-xs"></i>
            </div>

            {/* Sorting Dropdown */}
            <div className="relative w-full">
              <select 
                value={sortByParam}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="appearance-none w-full bg-[#F8FAFC] border-2 border-transparent hover:border-primary/20 rounded-xl px-10 py-3.5 font-bold text-[#111] outline-none cursor-pointer transition-all pr-12 text-sm"
              >
                <option value="featuredFirst">Featured First (Default)</option>
                <option value="nearestExpiry">Nearest Expiry</option>
                <option value="latestAdded">Latest Added</option>
                <option value="priceLowToHigh">Price: Low to High</option>
                <option value="priceHighToLow">Price: High to Low</option>
              </select>
              <i className="fas fa-sort-amount-down absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-sm"></i>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#AAA] pointer-events-none text-xs"></i>
            </div>
          </div>

          <div className="text-[0.9rem] text-[#888] font-bold bg-[#F8FAFC] xl:bg-transparent px-6 py-3.5 rounded-xl xl:p-0 w-full xl:w-auto text-center xl:text-right shrink-0 border border-[#F1F5F9] xl:border-none">
            Displaying <span className="text-primary font-black">{totalItems}</span> premium items
          </div>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 min-h-[400px]">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-[420px] bg-white rounded-[25px] animate-pulse border border-[#F1F5F9]"></div>
            ))
          ) : auctions.length > 0 ? (
            auctions.map((auction: any) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))
          ) : null}

          {/* Empty State */}
          {!isLoading && auctions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 lg:py-32 bg-white rounded-[35px] border-2 border-dashed border-[#F1F5F9] px-6 text-center shadow-sm">
              <div className="w-20 h-20 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-gavel text-3xl text-[#DDD]"></i>
              </div>
              <h3 className="text-2xl font-black text-[#111] mb-2">No auctions matched your criteria</h3>
              <p className="text-[#888] font-medium max-w-[360px] leading-relaxed mx-auto">
                Try selecting a different category or basket, or clear filters to see all live listings.
              </p>
              <button 
                onClick={() => {
                  router.push('/live-auctions');
                }}
                className="mt-8 bg-[#111] text-white px-10 py-4 rounded-xl font-black shadow-lg hover:bg-primary hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-wider text-xs"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Pagination Grid */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4 mt-16 lg:mt-24">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-black text-base lg:text-lg transition-all duration-300 ${pageParam === i + 1 ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-white text-[#888] border-2 border-[#F1F5F9] hover:border-primary hover:text-primary shadow-sm'}`}
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

export default function LiveAuctionsPage() {
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
      <LiveAuctionsContent />
    </Suspense>
  );
}
