import { useState, useEffect } from 'react';
import { commissionService } from '@/services/commission.service';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface CommissionBreakdownProps {
  productId: string;
  amount: number;
  showByDefaultForce?: boolean;
}

export default function CommissionBreakdown({ productId, amount, showByDefaultForce = false }: CommissionBreakdownProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(showByDefaultForce);

  useEffect(() => {
    const fetchCommission = async () => {
      if (!productId || !amount) return;
      setLoading(true);
      try {
        const result = await commissionService.calculate(productId, amount);
        setData(result);
      } catch (error) {
        console.error('Failed to calculate commission', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommission();
  }, [productId, amount]);

  if (loading) return <div className="text-[0.7rem] text-[#64748B] animate-pulse mt-2 flex items-center gap-2"><Info size={12} /> Calculating commission...</div>;
  if (!data || data.commissionAmount === 0) return null;

  return (
    <div className="mt-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[0.7rem] font-bold text-[#64748B] hover:text-primary transition-colors uppercase tracking-widest"
      >
        <Info size={14} className={isOpen ? 'text-primary' : ''} />
        <span>Estimated Total: ${data.finalAmount.toLocaleString()}</span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-[#F1F5F9] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.7rem] text-[#64748B] font-bold uppercase tracking-wider">Base Price</span>
            <span className="text-[0.85rem] font-black text-[#111]">${data.baseAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.7rem] text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
              <span>Commission ({data.commissionType === 'PERCENTAGE' ? `${data.commissionRate}%` : 'Flat'})</span>
              {data.commissionType === 'PERCENTAGE' && data.commissionAmount < (data.baseAmount * data.commissionRate) / 100 - 0.05 && (
                <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Capped</span>
              )}
            </span>
            <span className="text-[0.85rem] font-black text-primary">+ ${data.commissionAmount.toLocaleString()}</span>
          </div>
          <div className="h-px bg-slate-200 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-[0.75rem] text-[#111] font-black uppercase tracking-widest">Total Payable</span>
            <span className="text-[1rem] font-black text-green-600">${data.finalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
