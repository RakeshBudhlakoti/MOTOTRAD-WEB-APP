'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === '/') return null;

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      <Link 
        href="/" 
        className="text-slate-400 hover:text-blue-600 transition-colors p-1 -ml-1"
        title="Dashboard Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        
        // Custom formatting for common paths
        let label = path.replace(/-/g, ' ');
        if (label.toLowerCase() === 'cms') label = 'Content Management';
        
        return (
          <div key={path} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {isLast ? (
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-sm">
                {label}
              </span>
            ) : (
              <Link 
                href={href} 
                className="text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
