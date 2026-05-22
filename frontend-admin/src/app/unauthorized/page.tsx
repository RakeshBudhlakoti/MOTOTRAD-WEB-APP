'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
          Access Denied
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          You do not have the required role permissions to view this module. If you believe this is an error, please contact your system administrator.
        </p>

        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary dark:hover:bg-primary transition-all shadow-xl hover:shadow-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
