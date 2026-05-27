'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AuctionCard from '@/components/features/AuctionCard';
import CategoryCard from '@/components/features/CategoryCard';
import { auctionService } from '@/services/auction.service';
import { basketService, categoryService } from '@/services/catalog.service';
import { useAppQuery } from '@/hooks/useApp';

const TitleSeparator = () => (
  <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 mx-auto rounded-full mt-4 mb-6" />
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
    basketService.findAll({ limit: 6, isActive: 'true', isFeatured: 'true' })
  );

  const { data: categoriesData, isLoading: categoriesLoading } = useAppQuery(['homepage-categories'], () =>
    categoryService.findAll({ isFeatured: true })
  );

  const auctions = (auctionsData as any)?.items || [];
  const baskets = (basketsData as any)?.items || [];
  const categoriesRaw = categoriesData ? (Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).items || []) : [];
  const activeCategories = categoriesRaw.filter((cat: any) => cat.isActive !== false);

  const showCategoriesSection = categoriesLoading || activeCategories.length > 0;
  const showBasketsSection = basketsLoading || baskets.length > 0;

  return (
    <main className="flex-1 w-full animate-fade-in overflow-x-hidden">
      {/* Hero Section — Light & Airy with Parallax */}
      <header className="relative min-h-[35vh] md:min-h-[50vh] lg:min-h-[60vh] flex items-center justify-center text-center overflow-hidden">
        {/* Parallax Background Image — Light wash */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundImage: `url('https://images.pexels.com/photos/1191146/pexels-photo-1191146.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Light frosted overlay */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/90" />
        {/* Decorative blurred blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-20 px-6 max-w-[1000px] mx-auto py-10 md:py-20 lg:py-0 w-full">
          {/* Accent Badge */}
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-[10px] md:text-[11px] font-black text-primary uppercase tracking-[3px] bg-primary/5 px-5 py-2 rounded-full border border-primary/10 mb-6 md:mb-8"
          >
            <i className="fas fa-gem mr-2 text-[9px]"></i> Premium Auction Marketplace
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[2.6rem] md:text-[3.8rem] lg:text-[5rem] font-black tracking-tight mb-5 md:mb-6 leading-[1.05] uppercase select-none"
          >
            <span className="text-[#0F172A]">BUY, </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-500">RIDE</span>
            <span className="text-[#0F172A]"> OR </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">REVIVE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:block text-[0.95rem] md:text-[1.1rem] lg:text-[1.2rem] text-[#475569] max-w-[650px] mx-auto mb-10 lg:mb-12 font-medium tracking-normal leading-relaxed"
          >
            Discover and bid on the world's most coveted vintage cars, luxury timepieces, and premium motorcycles.
          </motion.p>
          
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={(e) => {
              e.preventDefault();
              const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
              if (query.trim()) {
                window.location.href = `/live-auctions?search=${encodeURIComponent(query)}`;
              }
            }}
            className="relative max-w-[600px] mx-auto w-full group"
          >
            <input 
              type="text" 
              name="search"
              placeholder="Search products..." 
              className="w-full bg-white/90 backdrop-blur-md pl-8 pr-16 py-4 lg:py-5 rounded-2xl outline-none text-sm lg:text-base text-[#111] font-bold border border-[#E2E8F0] transition-all shadow-[0_8px_30px_rgba(0,0,0,0.06)] focus:shadow-[0_12px_40px_rgba(0,0,0,0.1)] focus:border-primary/20 focus:bg-white" 
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white w-10 h-10 lg:w-11 lg:h-11 rounded-xl cursor-pointer text-sm transition-all duration-300 hover:bg-primary-hover hover:scale-105 active:scale-95 flex items-center justify-center shadow-md"
            >
              <i className="fas fa-search"></i>
            </button>
          </motion.form>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 md:mt-10"
          >
            {[
              { icon: 'fa-shield-halved', text: 'Verified Sellers' },
              { icon: 'fa-lock', text: 'Secure Bidding' },
              { icon: 'fa-award', text: 'Certified Items' },
            ].map((item, idx) => (
              <span key={idx} className="flex items-center gap-2 text-[0.72rem] md:text-[0.78rem] text-[#64748B] font-bold uppercase tracking-wider">
                <i className={`fas ${item.icon} text-primary/50 text-[0.7rem]`}></i>
                {item.text}
              </span>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Latest Auctions Section */}
      <section id="latest-auctions" className="bg-white pt-[60px] lg:pt-[100px] pb-12 lg:pb-20">
        <div className="container">
          <div className="text-center mb-[40px] lg:mb-[60px]">
            <h2 className="text-[2.2rem] lg:text-[3.2rem] font-black text-center tracking-tight text-[#0F172A] leading-tight">
              Latest <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Auctions</span>
            </h2>
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
      {showBasketsSection && (
        <section id="auction-baskets" className="bg-white py-[60px] lg:py-[100px] border-b border-[#F1F5F9]">
          <div className="container">
            <div className="text-center mb-[40px] lg:mb-[60px]">
              <h2 className="text-[2.2rem] lg:text-[3.2rem] font-black text-center tracking-tight text-[#0F172A] leading-tight">
                Browse By <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Events</span>
              </h2>
              <TitleSeparator />
              <p className="text-[#64748B] mt-4 text-sm lg:text-base font-medium max-w-[500px] mx-auto leading-relaxed px-4">
                Explore curated auction groups organized by location and event
              </p>
            </div>

            {basketsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6 lg:gap-8">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-[220px] md:h-[320px] lg:h-[360px] bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6 lg:gap-8">
                {baskets.map((basket: any) => (
                  <Link
                    key={basket.id}
                    href={`/live-auctions?basket=${basket.slug || basket.id}`}
                    className="relative min-h-[220px] md:min-h-[320px] lg:min-h-[380px] rounded-2xl bg-cover bg-center overflow-hidden flex items-end no-underline transition-all duration-300 shadow-md hover:scale-[1.02] hover:shadow-xl group"
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

                    <div className="relative z-20 p-4 md:p-6 lg:p-8 w-full">
                      <span className="text-[9px] md:text-[0.75rem] text-[#F39C12] font-black uppercase tracking-[1px] md:tracking-[2px] block mb-1 md:mb-2">
                        <i className="fas fa-layer-group mr-1.5"></i> {basket._count?.products || 0} Items
                      </span>
                      <h3 className="text-white text-xs md:text-2xl font-black mb-1.5 md:mb-3 uppercase tracking-tight leading-tight">
                        {basket.name}
                      </h3>
                      {basket.description && (
                        <p className="text-white/70 text-[10px] md:text-xs font-medium leading-relaxed mb-3 md:mb-4 line-clamp-2 hidden md:block">
                          {basket.description}
                        </p>
                      )}
                      <span className="inline-block px-3 py-1.5 md:px-5 md:py-2 rounded-full border-2 border-white text-white font-bold text-[9px] md:text-xs uppercase tracking-wider transition-all duration-300 group-hover:bg-white group-hover:text-black">
                        View Auctions
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Auctions Grid (Browse Categories) */}
      {showCategoriesSection && (
        <section id="categories-view" className="bg-[#F8FAFC] py-[60px] lg:py-[100px] border-y border-[#F1F5F9]">
          <div className="container">
            <div className="text-center mb-[40px] lg:mb-[60px]">
              <h2 className="text-[2.2rem] lg:text-[3.2rem] font-black text-center tracking-tight text-[#0F172A] leading-tight">
                Browse <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Categories</span>
              </h2>
              <TitleSeparator />
            </div>
            {categoriesLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6 lg:gap-8">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-[200px] md:h-[280px] lg:h-[320px] bg-white rounded-2xl md:rounded-3xl border border-[#F1F5F9] animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6 lg:gap-8">
                {activeCategories.slice(0, 6).map((cat: any) => {
                  const bgImage = cat.imageUrl && cat.imageUrl.trim() !== ''
                    ? cat.imageUrl
                    : (DEFAULT_CATEGORY_IMAGES[cat.slug] || 'https://images.pexels.com/photos/1191146/pexels-photo-1191146.jpeg?auto=compress&cs=tinysrgb&w=800');
                  
                  return (
                    <CategoryCard 
                      key={cat.id} 
                      title={cat.name} 
                      slug={cat.slug}
                      image={bgImage} 
                      productsCount={cat._count?.products}
                      location="Active Listings"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="bg-slate-50/50 py-[48px] md:py-[80px] lg:py-[120px] relative overflow-hidden border-t border-[#F1F5F9]">
        {/* Soft Background Blobs for Modern Aesthetic */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -40;
            }
          }
          .animate-dash {
            animation: dash 4s linear infinite;
            stroke-dashoffset: 0;
          }
        `}</style>

        <div className="container relative z-10">
          {/* Header Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-16 lg:mb-24"
          >
            <span className="text-[10px] font-black text-primary uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
              Process Guide
            </span>
            <h2 className="text-[1.8rem] md:text-[2.2rem] lg:text-[3.2rem] font-black text-center tracking-tight text-[#0F172A] leading-tight">
              How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Works</span>
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 mx-auto rounded-full mt-3 mb-3 md:mt-4 md:mb-4" />
            <p className="text-center text-[#475569] max-w-[550px] mx-auto text-xs sm:text-sm lg:text-base font-medium leading-relaxed px-4">
              Experience a highly secured, transparent, and seamless auction journey from registration to ownership.
            </p>
          </motion.div>
          
          <div className="relative">
            {/* SVG Animated Connector Line (Desktop Only) */}
            <div className="absolute top-[90px] left-[12%] right-[12%] h-[4px] hidden xl:block z-0 pointer-events-none">
              <svg className="w-full h-[40px] overflow-visible" fill="none">
                <path
                  d="M 0 20 C 150 40, 300 0, 450 20 C 600 40, 750 0, 950 20" 
                  stroke="url(#flow-gradient)"
                  strokeWidth="3.5"
                  strokeDasharray="9,9"
                  className="animate-dash"
                />
                <defs>
                  <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF9F43" />
                    <stop offset="33%" stopColor="#1DD1A1" />
                    <stop offset="66%" stopColor="#FF6B6B" />
                    <stop offset="100%" stopColor="#2E86DE" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Grid of Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-8">
              {[
                { 
                  id: '01', 
                  title: 'Registration', 
                  bgLight: '#FFF9F2', 
                  icon: 'fa-user-check', 
                  color: '#FF9F43', 
                  shadowRGB: '255, 159, 67',
                  bullets: ['Quick Signup', 'KYC Verification', 'Secure Profile'] 
                },
                { 
                  id: '02', 
                  title: 'Select Product', 
                  bgLight: '#EEFDF8', 
                  icon: 'fa-search-location', 
                  color: '#1DD1A1', 
                  shadowRGB: '29, 209, 161',
                  bullets: ['Browse Categories', 'Inspection Reports', 'Compare Items'] 
                },
                { 
                  id: '03', 
                  title: 'Go to Bidding', 
                  bgLight: '#FFF5F5', 
                  icon: 'fa-gavel', 
                  color: '#FF6B6B', 
                  shadowRGB: '255, 107, 107',
                  bullets: ['Live Bidding', 'Instant Alerts', 'Auto-Bid Support'] 
                },
                { 
                  id: '04', 
                  title: 'Make Payment', 
                  bgLight: '#EDF5FC', 
                  icon: 'fa-credit-card', 
                  color: '#2E86DE', 
                  shadowRGB: '46, 134, 222',
                  bullets: ['Secure Checkout', 'Escrow Service', 'Final Delivery'] 
                }
              ].map((step, idx) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15, type: 'spring', stiffness: 100 }}
                  whileHover={{ 
                    y: -12, 
                    scale: 1.015,
                    boxShadow: `0 20px 40px -15px rgba(${step.shadowRGB}, 0.2), 0 0 0 1px rgba(${step.shadowRGB}, 0.1)` 
                  }}
                  className="group relative flex flex-col p-6 md:p-8 rounded-3xl bg-white border border-[#E2E8F0]/70 shadow-[0_12px_30px_-15px_rgba(0,0,0,0.04)] transition-all duration-300 z-10"
                  style={{
                    '--shadow-rgb': step.shadowRGB,
                    '--color-primary': step.color,
                    '--color-light': step.bgLight
                  } as React.CSSProperties}
                >
                  {/* Step Capsule & Step Ghost Counter */}
                  <div className="flex justify-between items-center mb-5 md:mb-8">
                    <span className="text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full text-[var(--color-primary)] bg-[var(--color-light)] border border-[var(--color-primary)]/10">
                      STEP {step.id}
                    </span>
                    <span className="text-3xl font-black text-slate-100/90 group-hover:text-[var(--color-light)] select-none transition-colors duration-300">
                      0{step.id}
                    </span>
                  </div>

                  {/* Icon with Glowing Gradient Circle */}
                  <div 
                    className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}DD)`,
                      boxShadow: `0 10px 20px -8px rgba(${step.shadowRGB}, 0.5)`
                    }}
                  >
                    <i className={`fas ${step.icon} text-white text-lg md:text-2xl`}></i>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-base md:text-lg lg:text-xl font-bold mb-2.5 md:mb-4 text-[#0F172A] tracking-tight transition-colors duration-300 group-hover:text-[var(--color-primary)]">
                    {step.title}
                  </h3>

                  {/* Checklist Sub-items */}
                  <ul className="flex flex-col gap-2.5 md:gap-3.5 mt-auto pt-3 md:pt-4 border-t border-[#F8FAFC]">
                    {step.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-[12px] md:text-[13px] text-[#475569] font-semibold flex gap-2.5 md:gap-3 items-center leading-tight transition-colors duration-300 group-hover:text-slate-800">
                        <span className="w-4.5 h-4.5 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] md:text-[9px] bg-slate-50 text-slate-400 group-hover:bg-[var(--color-light)] group-hover:text-[var(--color-primary)] transition-all duration-300">
                          <i className="fas fa-check"></i>
                        </span> 
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
