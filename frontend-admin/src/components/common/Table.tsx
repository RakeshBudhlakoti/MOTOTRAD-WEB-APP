import { cn } from '@/lib/utils';

interface TableProps {
  columns: {
    header: string;
    accessor: string;
    render?: (item: any) => React.ReactNode;
  }[];
  data: any[];
  isLoading?: boolean;
}

export default function Table({ columns, data, isLoading }: TableProps) {
  return (
    <div className="w-full bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-8 py-5 text-[0.7rem] font-black uppercase tracking-widest text-slate-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-8 py-6">
                      <div className="h-4 w-full rounded-lg bg-slate-50"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-[#FDFDFD] transition-colors group"
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-8 py-6 whitespace-nowrap">
                      <div className="text-[0.9rem] font-medium text-slate-700 transition-colors group-hover:text-[#111]">
                        {col.render ? col.render(item) : item[col.accessor]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-8 py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                     </div>
                     <p className="text-[0.75rem] font-black uppercase tracking-widest text-slate-300">No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
