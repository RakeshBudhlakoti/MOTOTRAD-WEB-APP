'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ShieldCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const kycSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  taxId: z.string().min(5, 'Tax ID is required'),
  idNumber: z.string().min(5, 'ID number is required'),
  businessAddress: z.string().min(10, 'Full business address is required'),
});

type KycFormData = z.infer<typeof kycSchema>;

export default function KYCForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  });

  const onSubmit = async (data: KycFormData) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), // Mock API
      {
        loading: 'Uploading documents...',
        success: 'KYC submitted for review!',
        error: 'Upload failed',
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-950 rounded-[40px] p-12 border border-slate-100 dark:border-slate-800 shadow-2xl">
      <div className="text-center mb-10">
        <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-black font-outfit mb-2">Seller Verification</h2>
        <p className="text-slate-500">Complete your KYC to start listing auctions.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Company Name</label>
            <input
              {...register('companyName')}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g. Acme Motors"
            />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Tax ID / VAT</label>
            <input
              {...register('taxId')}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g. TAX-123456"
            />
            {errors.taxId && <p className="text-red-500 text-xs mt-1">{errors.taxId.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Business Address</label>
          <textarea
            {...register('businessAddress')}
            rows={3}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            placeholder="Street address, City, Country"
          />
          {errors.businessAddress && <p className="text-red-500 text-xs mt-1">{errors.businessAddress.message}</p>}
        </div>

        {/* Document Upload Placeholder */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center hover:border-blue-500 transition-all group cursor-pointer">
          <div className="h-12 w-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold">Upload Government ID</p>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG (Max 5MB)</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Your data is encrypted and used solely for identity verification. Review process takes 24-48 hours.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          Submit for Approval
        </button>
      </form>
    </div>
  );
}
