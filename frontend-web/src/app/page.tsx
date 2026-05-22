'use client';

import Link from 'next/link';
import AuctionCard from '@/components/features/AuctionCard';
import CategoryCard from '@/components/features/CategoryCard';
import { auctionService } from '@/services/auction.service';
import { basketService, categoryService } from '@/services/catalog.service';
import { useAppQuery } from '@/hooks/useApp';

const TitleSeparator = () => (
  <div className="flex items-center justify-center gap-[15px] max-w-[250px] mx-auto">
    <span className="h-[1.5px] bg-[#e0e0e0] grow"></span>
    <i className="fas fa-gavel text-primary text-base"></i>
    <span className="h-[1.5px] bg-[#e0e0e0] grow"></span>
  </div>
);

const DEFAULT_CATEGORY_IMAGES: { [key: string]: string } = {
  'vintage-cars': 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800',
  'luxury-watches': 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
  'gemstones': 'https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800',
  'motorcycles': 'https://images.pexels.com/photos/2626671/pexels-photo-2626671.jpeg?auto=compress&cs=tinysrgb&w=800',
  'handicrafts': 'https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=800',
  'electrical-appliances': 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const BASKET_GRADIENTS = [
  'from-[#C90000] to-[#7f0000]',
  'from-[#1a237e] to-[#283593]',
  'from-[#1b5e20] to-[#2e7d32]',
  'from-[#4a148c] to-[#6a1b9a]',
  'from-[#e65100] to-[#bf360c]',
  'from-[#006064] to-[#00838f]',
];

const BASKET_ICONS = ['fa-map-marker-alt', 'fa-gavel', 'fa-star', 'fa-trophy', 'fa-fire', 'fa-gem'];

export default function HomePage() {
  const { data: auctionsData, isLoading: auctionsLoading } = useAppQuery(['featured-auctions'], () =>
    auctionService.findAll({ limit: 4, status: 'ACTIVE' })
  );

  const { data: basketsData, isLoading: basketsLoading } = useAppQuery(['homepage-baskets'], () =>
    basketService.findAll({ limit: 6, isActive: 'true' })
  );

  const { data: categoriesData } = useAppQuery(['homepage-categories'], () =>
    categoryService.findAll()
  );

  const auctions = (auctionsData as any)?.items || [];
  const baskets = (basketsData as any)?.items || [];
  const categoriesRaw = categoriesData ? (Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).items || []) : [];

  const displayCategories = categoriesRaw.length > 0 ? categoriesRaw.slice(0, 6) : [
    { id: '1', name: 'Vintage Cars', slug: 'vintage-cars', imageUrl: '' },
    { id: '2', name: 'Luxury Watches', slug: 'luxury-watches', imageUrl: '' },
    { id: '3', name: 'Gemstones', slug: 'gemstones', imageUrl: '' },
    { id: '4', name: 'Motorcycles', slug: 'motorcycles', imageUrl: '' },
    { id: '5', name: 'Handicrafts', slug: 'handicrafts', imageUrl: '' },
    { id: '6', name: 'Electrical Appliances', slug: 'electrical-appliances', imageUrl: '' },
  ];

  return (
    <main className="flex-1 w-full animate-fade-in overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative min-h-[30vh] md:min-h-[45vh] lg:min-h-[55vh] flex items-center justify-center text-center overflow-hidden">
        {/* Grayscale Background Image */}
        <div 
          className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1191146/pexels-photo-1191146.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center bg-fixed grayscale brightness-[0.32] contrast-[1.05]"
          style={{ transform: 'scale(1.01)' }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/35 z-10" />
 
        <div className="relative z-20 px-6 max-w-[1000px] mx-auto py-8 md:py-16 lg:py-0 w-full">
          <h1 className="text-[2.8rem] md:text-[4rem] lg:text-[5.5rem] font-black tracking-tight mb-6 text-white drop-shadow-xl leading-none uppercase select-none">
            BUY, RIDE OR REVIVE
          </h1>
          <p className="hidden md:block text-[0.95rem] md:text-[1.1rem] lg:text-[1.25rem] text-white/80 max-w-[700px] mx-auto mb-10 lg:mb-12 font-medium tracking-normal leading-relaxed">
            Discover and bid on the world's most coveted vintage cars, luxury timepieces, and premium motorcycles.
          </p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
              if (query.trim()) {
                window.location.href = `/live-auctions?search=${encodeURIComponent(query)}`;
              }
            }}
            className="relative max-w-[650px] mx-auto w-full group shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden mt-8"
          >
            <input 
              type="text" 
              name="search"
              placeholder="Search products..." 
              className="w-full bg-white pl-8 pr-16 py-4 lg:py-5 rounded-2xl outline-none text-sm lg:text-base text-[#111] font-bold border-none transition-all shadow-[0_15px_40px_rgba(0,0,0,0.15)] focus:shadow-[0_20px_50px_rgba(0,0,0,0.25)]" 
            />
            <button 
              type="submit" 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-primary p-3 cursor-pointer text-lg lg:text-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
            >
              <i className="fas fa-search text-primary"></i>
            </button>
          </form>
        </div>
      </header>

      {/* Latest Auctions Section */}
      <section id="latest-auctions" className="bg-white pt-[60px] lg:pt-[100px] pb-12 lg:pb-20">
        <div className="container">
          <div className="text-center mb-[40px] lg:mb-[60px]">
            <h2 className="text-[1.8rem] lg:text-[2.6rem] font-extrabold text-[#111] uppercase tracking-tight mb-3">LATEST AUCTIONS</h2>
            <TitleSeparator />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {auctionsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-[350px] bg-[#F8FAFC] rounded-xl animate-pulse"></div>
              ))
            ) : auctions.length > 0 ? (
              auctions.map((auction: any) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-[#888]">
                <i className="fas fa-gavel text-4xl mb-4 block opacity-20"></i>
                <p className="font-bold text-sm uppercase tracking-widest">No active auctions at the moment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== AUCTION BASKETS SECTION ===== */}
      <section id="auction-baskets" className="bg-white py-[60px] lg:py-[100px] border-b border-[#F1F5F9]">
        <div className="container">
          <div className="text-center mb-[40px] lg:mb-[60px]">
            <p className="text-primary text-[0.7rem] font-black uppercase tracking-[4px] mb-3">Browse by Event</p>
            <h2 className="text-[1.8rem] lg:text-[2.6rem] font-extrabold text-[#111] uppercase tracking-tight mb-3">AUCTION BASKETS</h2>
            <TitleSeparator />
            <p className="text-[#64748B] mt-4 text-sm font-medium max-w-[500px] mx-auto leading-relaxed">
              Explore curated auction groups organized by location and event
            </p>
          </div>

          {basketsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-[360px] bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] animate-pulse"></div>
              ))}
            </div>
          ) : baskets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {baskets.map((basket: any) => (
                <Link
                  key={basket.id}
                  href={`/live-auctions?basket=${basket.slug || basket.id}`}
                  className="relative min-h-[380px] rounded-2xl bg-cover bg-center overflow-hidden flex items-end no-underline transition-all duration-300 shadow-md hover:scale-[1.02] hover:shadow-xl group"
                  style={{
                    backgroundImage: `url("${
                      basket.image && basket.image.trim() !== ''
                        ? basket.image
                        : 'https://images.pexels.com/photos/1191146/pexels-photo-1191146.jpeg?auto=compress&cs=tinysrgb&w=800'
                    }")`,
                  }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>

                  <div className="relative z-20 p-6 lg:p-8 w-full">
                    <span className="text-[0.75rem] text-[#F39C12] font-black uppercase tracking-[2px] block mb-2">
                      <i className="fas fa-layer-group mr-1.5"></i> {basket._count?.products || 0} Items
                    </span>
                    <h3 className="text-white text-2xl font-black mb-3 uppercase tracking-tight leading-tight">
                      {basket.name}
                    </h3>
                    {basket.description && (
                      <p className="text-white/70 text-xs font-medium leading-relaxed mb-4 line-clamp-2">
                        {basket.description}
                      </p>
                    )}
                    <span className="inline-block px-5 py-2 rounded-full border-2 border-white text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 group-hover:bg-white group-hover:text-black">
                      View Auctions
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#64748B]/60">
              <i className="fas fa-layer-group text-5xl mb-4 block"></i>
              <p className="font-bold text-sm uppercase tracking-widest">No auction baskets configured yet</p>
              <p className="text-xs mt-1 text-[#64748B]/40">Admins can create baskets from the admin panel</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Auctions Grid */}
      <section id="categories-view" className="bg-[#F8FAFC] py-[60px] lg:py-[100px] border-y border-[#F1F5F9]">
        <div className="container">
          <div className="text-center mb-[40px] lg:mb-[60px]">
            <h2 className="text-[1.8rem] lg:text-[2.6rem] font-extrabold text-[#111] uppercase tracking-tight mb-3">BROWSE CATEGORIES</h2>
            <TitleSeparator />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {displayCategories.map((cat: any) => {
              const bgImage = cat.imageUrl && cat.imageUrl.trim() !== ''
                ? cat.imageUrl
                : (DEFAULT_CATEGORY_IMAGES[cat.slug] || 'https://images.pexels.com/photos/1191146/pexels-photo-1191146.jpeg?auto=compress&cs=tinysrgb&w=800');
              
              return (
                <CategoryCard 
                  key={cat.id} 
                  title={cat.name} 
                  image={bgImage} 
                  productsCount={cat._count?.products}
                  location="Active Listings"
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-[60px] lg:py-[100px]">
        <div className="container">
          <h2 className="text-[2rem] lg:text-[2.8rem] font-extrabold text-center mb-2 tracking-tight text-[#111]">How It Works</h2>
          <p className="text-center text-[#64748B] mb-10 lg:mb-16 max-w-[600px] mx-auto text-sm lg:text-base font-medium px-4 leading-relaxed">Experience a seamless auction process from registration to ownership.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: '01', title: 'Registration', bg: '#FFF9F2', icon: 'fa-user-check', color: '#E67E22', bullet1: 'Quick Signup', bullet2: 'KYC Verification', bullet3: 'Secure Profile' },
              { id: '02', title: 'Select Product', bg: '#F4FCF0', icon: 'fa-search-location', color: '#27AE60', bullet1: 'Browse Categories', bullet2: 'Inspection Reports', bullet3: 'Compare Items' },
              { id: '03', title: 'Go to Bidding', bg: '#FFF4F6', icon: 'fa-gavel', color: '#C0392B', bullet1: 'Live Bidding', bullet2: 'Instant Alerts', bullet3: 'Auto-Bid Support' },
              { id: '04', title: 'Make Payment', bg: '#F2F9FF', icon: 'fa-wallet', color: '#2980B9', bullet1: 'Secure Checkout', bullet2: 'Escrow Service', bullet3: 'Final Delivery' }
            ].map((step) => (
              <div key={step.id} className="relative flex flex-col p-8 rounded-2xl border border-transparent hover:border-[#E2E8F0] hover:shadow-md transition-all duration-300" style={{ backgroundColor: step.bg }}>
                <span className="absolute top-6 right-8 font-extrabold text-[0.65rem] text-black/10 tracking-[2px] uppercase">STEP {step.id}</span>
                <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-8">
                  <i className={`fas ${step.icon} text-xl lg:text-2xl`} style={{ color: step.color }}></i>
                </div>
                <h3 className="text-lg lg:text-xl font-extrabold mb-6 text-[#111]">{step.title}</h3>
                <ul className="flex flex-col gap-3">
                  {[step.bullet1, step.bullet2, step.bullet3].map((bullet, bIdx) => (
                    <li key={bIdx} className="text-[0.8rem] lg:text-[0.85rem] text-[#64748B] font-semibold flex gap-2.5 items-center leading-tight">
                        <span className="text-[#111] font-black opacity-20 text-[0.65rem]">0{bIdx + 1}.</span> {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
