'use client';

import React, { useEffect, useState } from 'react';
import { healthService } from '@/services/health.service';
import Link from 'next/link';

interface HealthData {
  status: string;
  info: Record<string, { status: string; [key: string]: any }>;
  error: Record<string, any>;
  details: Record<string, { status: string; [key: string]: any }>;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await healthService.checkBackendHealth();
      setHealth(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError('Backend is unreachable or returned an error.');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    return status === 'up' ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50';
  };

  const getIndicatorIcon = (key: string) => {
    switch (key) {
      case 'database': return 'fa-database';
      case 'redis': return 'fa-bolt';
      case 's3': return 'fa-cloud';
      case 'memory_heap': return 'fa-memory';
      case 'storage': return 'fa-hard-drive';
      default: return 'fa-check-circle';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <Link href="/" className="text-primary font-black text-[0.75rem] uppercase tracking-[3px] mb-2 flex items-center gap-2 group">
              <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i> Back to Home
            </Link>
            <h1 className="text-[2.5rem] font-black text-[#111] uppercase tracking-tight leading-none">System Health</h1>
            <p className="text-[#64748B] font-bold text-[0.9rem] mt-2 uppercase tracking-widest">Infrastructure Monitor</p>
          </div>
          
          <button 
            onClick={fetchHealth}
            disabled={loading}
            className="bg-white border-2 border-primary text-primary px-8 py-3 rounded-2xl font-black text-[0.8rem] uppercase tracking-widest transition-all hover:bg-primary hover:text-white shadow-xl flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
            Refresh Status
          </button>
        </div>

        {/* Global Status */}
        <div className={`mb-10 p-10 rounded-[40px] shadow-2xl border-4 transition-all duration-500 ${!error && health?.status === 'ok' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-[25px] flex items-center justify-center text-[2.5rem] shadow-lg ${!error && health?.status === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {!error && health?.status === 'ok' ? <i className="fas fa-check-double"></i> : <i className="fas fa-exclamation-triangle"></i>}
              </div>
              <div>
                <h2 className="text-[1.8rem] font-black text-[#111] uppercase tracking-tight">System {!error && health?.status === 'ok' ? 'Operational' : 'Partial Outage'}</h2>
                <p className="text-[#64748B] font-bold text-[0.85rem] uppercase tracking-widest">
                  Last Checked: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <span className={`px-8 py-2 rounded-full font-black text-[1rem] uppercase tracking-widest border-2 ${!error && health?.status === 'ok' ? 'border-green-500 text-green-600 bg-white' : 'border-red-500 text-red-600 bg-white'}`}>
                {!error && health?.status === 'ok' ? 'ALL SYSTEMS GO' : 'ACTION REQUIRED'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-6 rounded-2xl mb-8 font-bold flex items-center gap-4 animate-bounce">
            <i className="fas fa-wifi-slash text-2xl"></i>
            <div>
              <p className="uppercase tracking-widest text-[0.7rem] opacity-70">Critical Connection Error</p>
              <p className="text-[1.1rem]">{error}</p>
            </div>
          </div>
        )}

        {/* Dependency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {health && Object.entries(health.details).map(([key, details]) => (
            <div key={key} className="bg-white p-8 rounded-[35px] shadow-sm border border-[#F1F5F9] group hover:border-primary/20 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${getStatusColor(details.status)}`}>
                  <i className={`fas ${getIndicatorIcon(key)}`}></i>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[0.7rem] font-black uppercase tracking-widest border ${details.status === 'up' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {details.status === 'up' ? 'HEALTHY' : 'DOWN'}
                </span>
              </div>
              <h3 className="text-[1.2rem] font-black text-[#111] uppercase tracking-tight mb-2">{key.replace('_', ' ')}</h3>
              <p className="text-[#64748B] text-[0.85rem] font-semibold">
                {details.status === 'up' ? `The ${key} connection is active and responding with low latency.` : `The ${key} service is currently unavailable.`}
              </p>
              
              {/* Detailed Info if available */}
              {key === 'memory_heap' && details.used && (
                <div className="mt-6 pt-6 border-t border-[#F8FAFC]">
                   <div className="flex justify-between text-[0.75rem] font-bold text-[#64748B] uppercase mb-2">
                     <span>Memory Used</span>
                     <span>{(details.used / 1024 / 1024).toFixed(2)} MB</span>
                   </div>
                   <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                     <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${Math.min((details.used / (150 * 1024 * 1024)) * 100, 100)}%` }}></div>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[#94A3B8] text-[0.8rem] font-bold uppercase tracking-widest italic">
            &copy; {new Date().getFullYear()} Mototrad Infrastructure Dashboard • Real-time Monitoring Active
          </p>
        </div>
      </div>
    </div>
  );
}
