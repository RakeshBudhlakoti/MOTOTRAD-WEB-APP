'use client';

import Link from 'next/link';

interface CategoryCardProps {
  title: string;
  image: string;
  location?: string;
  productsCount?: number;
}

export default function CategoryCard({ title, image, location = "California", productsCount }: CategoryCardProps) {
  const categorySlug = title.toLowerCase().replace(' ', '-');

  return (
    <Link 
      href={`/live-auctions?category=${categorySlug}`} 
      className="relative h-[320px] rounded-3xl overflow-hidden flex items-end no-underline transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] group block"
    >
      {/* Background Image Container with dynamic hover zoom */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108 grayscale-[25%] group-hover:grayscale-0 brightness-[0.75] group-hover:brightness-[0.82]" 
        style={{ backgroundImage: `url("${image}")` }}
      />
      
      {/* Dynamic Colored Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10 transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
      
      {/* Frosted Glass Information Panel */}
      <div className="relative z-20 w-full p-4">
        <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/15 group-hover:border-white/25 group-hover:translate-y-[-4px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] text-primary font-black uppercase tracking-[2px] block mb-1">
                <i className={productsCount !== undefined ? "fas fa-layer-group mr-1.5" : "fas fa-map-marker-alt mr-1.5"}></i>
                {productsCount !== undefined ? `${productsCount} Items` : location}
              </span>
              <h3 className="text-white text-xl lg:text-2xl font-black uppercase tracking-tight leading-none mb-1 transition-all duration-300">
                {title}
              </h3>
            </div>
            
            {/* Premium circular arrow button */}
            <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:rotate-[-45deg] shrink-0">
              <i className="fas fa-arrow-right text-xs"></i>
            </div>
          </div>

          {/* Inline Action Indicator */}
          <div className="overflow-hidden max-h-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-h-10 group-hover:opacity-100 group-hover:mt-3">
            <span className="text-[10px] text-white/90 font-extrabold uppercase tracking-[1.5px] flex items-center gap-1.5">
              Explore Active Listings <i className="fas fa-arrow-right text-[8px] animate-pulse"></i>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
