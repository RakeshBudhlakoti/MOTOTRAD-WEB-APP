'use client';

import { BarChart3, Package, Gavel, DollarSign, Plus, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STATS = [
  { label: 'Total Sales', value: '$124,500', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Live Auctions', value: '12', icon: Gavel, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Total Products', value: '45', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Avg. Bid Rate', value: '8.4x', icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function SellerDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black font-outfit">Seller Dashboard</h1>
          <p className="text-slate-500 mt-2">Manage your inventory and track auction performance.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
          <Plus className="h-5 w-5" />
          Create New Auction
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-950 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className={`h-12 w-12 ${stat.bg} dark:bg-slate-900 rounded-2xl flex items-center justify-center ${stat.color} mb-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black mt-1 font-outfit">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Auctions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center">
            <h2 className="text-xl font-bold">Your Active Auctions</h2>
            <button className="text-blue-600 text-sm font-bold">View All</button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-900">
             {[1, 2, 3].map((item) => (
               <div key={item} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-2xl"></div>
                    <div>
                      <h3 className="font-bold">2022 Mercedes AMG G63</h3>
                      <p className="text-xs text-slate-400">Ends in 2h 45m • 14 Bids</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-blue-600">$185,000</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                       <ArrowUpRight className="h-3 w-3" /> +12%
                    </span>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Sales Chart / Summary */}
        <div className="bg-slate-900 text-white rounded-[40px] p-8 relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-xl font-bold mb-6">Sales Performance</h2>
              <div className="space-y-6">
                 <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">This Month</p>
                    <p className="text-4xl font-black font-outfit">$42,800</p>
                 </div>
                 <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-3/4 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                 </div>
                 <p className="text-sm text-slate-400">75% of your monthly goal reached.</p>
              </div>
           </div>
           {/* Decorative Glow */}
           <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
        </div>
      </div>
    </div>
  );
}
