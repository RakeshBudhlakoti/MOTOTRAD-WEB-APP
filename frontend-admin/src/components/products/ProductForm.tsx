'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { 
  Package, 
  Gavel, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Info, 
  Settings,
  DollarSign,
  PlaySquare,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  optionIds: z.array(z.string()).optional(),
  sellerId: z.string().min(1, 'Seller is required'),
  auctionType: z.enum(['BID_ONLY', 'BUY_NOW_ONLY', 'BOTH']),
  startingBid: z.number().min(0).optional(),
  buyItNowPrice: z.number().min(0).optional(),
  reservePrice: z.number().min(0).optional(),
  bidIncrement: z.number().min(1).optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  useGlobalCommission: z.boolean().optional(),
  commissionType: z.enum(['FLAT', 'PERCENTAGE']).optional(),
  commissionAmount: z.number().min(0).optional(),
  quantity: z.number().min(1).optional(),
  isLive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  categories: any[];
  sellers: any[];
  options: any[];
}

export default function ProductForm({ initialData, onSubmit, isLoading, categories, sellers, options }: ProductFormProps) {
  const [activeSection, setActiveSection] = useState('basic');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      auctionType: 'BID_ONLY',
      useGlobalCommission: true,
      commissionType: 'PERCENTAGE',
      quantity: 1,
      isLive: false,
      isFeatured: false,
      bidIncrement: 10
    }
  });

  const auctionType = watch('auctionType');
  const useGlobalCommission = watch('useGlobalCommission');

  const SECTIONS = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'auction', label: 'Auction Logic', icon: Gavel },
    { id: 'commission', label: 'Commission', icon: DollarSign },
    { id: 'media', label: 'Media & Gallery', icon: ImageIcon },
    { id: 'status', label: 'Visibility', icon: Settings },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sticky Form Navigation */}
        <div className="lg:col-span-1">
          <div className="sticky top-[80px] space-y-1">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all border-l-4 ${
                  activeSection === section.id 
                    ? 'bg-blue-50 border-blue-600 text-blue-700' 
                    : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon size={16} />
                  {section.label}
                </div>
                {activeSection === section.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </button>
            ))}

            <div className="mt-6 p-4 bg-white border border-slate-200 rounded-sm">
               <Button type="submit" className="w-full py-3 uppercase tracking-widest text-xs font-black" isLoading={isLoading}>
                 <CheckCircle2 size={16} className="mr-2" /> Save Product
               </Button>
               <Button type="button" variant="outline" className="w-full mt-2 py-2 text-xs font-bold" onClick={() => window.history.back()}>
                 Cancel
               </Button>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section: Basic Information */}
          <Card title="Basic Information" className={activeSection !== 'basic' ? 'hidden' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Product Title" {...register('title')} error={errors.title?.message} placeholder="e.g. 2024 Tesla Model S" />
              <Input label="Slug / Permalink" {...register('slug')} error={errors.slug?.message} placeholder="2024-tesla-model-s" />
            </div>
            <Input label="Description" multiline {...register('description')} error={errors.description?.message} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-1">
                <label className="admin-label">Product Category</label>
                <select {...register('categoryId')} className="admin-input">
                  <option value="">Select Category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-[10px] text-red-600 font-bold">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="admin-label">Assigned Seller</label>
                <select {...register('sellerId')} className="admin-input">
                  <option value="">Select Seller</option>
                  {sellers?.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                {errors.sellerId && <p className="text-[10px] text-red-600 font-bold">{errors.sellerId.message}</p>}
              </div>
            </div>
          </Card>

          {/* Section: Auction Information */}
          <Card title="Auction Configuration" className={activeSection !== 'auction' ? 'hidden' : ''}>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Auction Type</p>
                <p className="text-[10px] text-slate-500 font-medium">Select how users can purchase this item.</p>
              </div>
              <div className="flex gap-2">
                {['BID_ONLY', 'BUY_NOW_ONLY', 'BOTH'].map(type => (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => setValue('auctionType', type as any)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                      auctionType === type ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auctionType !== 'BUY_NOW_ONLY' && (
                <>
                  <Input label="Opening Price ($)" type="number" {...register('startingBid', { valueAsNumber: true })} error={errors.startingBid?.message} />
                  <Input label="Reserve Price ($)" type="number" {...register('reservePrice', { valueAsNumber: true })} error={errors.reservePrice?.message} helpText="Minimum price to sell" />
                  <Input label="Bid Increment ($)" type="number" {...register('bidIncrement', { valueAsNumber: true })} error={errors.bidIncrement?.message} />
                </>
              )}
              {(auctionType === 'BUY_NOW_ONLY' || auctionType === 'BOTH') && (
                <Input label="Buy It Now Price ($)" type="number" {...register('buyItNowPrice', { valueAsNumber: true })} error={errors.buyItNowPrice?.message} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-t border-slate-100 pt-6">
              <Input label="Auction Start Date" type="datetime-local" {...register('startTime')} error={errors.startTime?.message} />
              <Input label="Auction End Date" type="datetime-local" {...register('endTime')} error={errors.endTime?.message} />
            </div>
          </Card>

          {/* Section: Commission */}
          <Card title="Commission Settings" className={activeSection !== 'commission' ? 'hidden' : ''}>
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-sm border border-slate-200 text-blue-600"><DollarSign size={18} /></div>
                 <div>
                   <p className="text-sm font-bold">Use Global Commission Settings</p>
                   <p className="text-[10px] text-slate-500 font-medium">Override system-wide fees for this specific product.</p>
                 </div>
               </div>
               <button 
                 type="button"
                 onClick={() => setValue('useGlobalCommission', !useGlobalCommission)}
                 className={`w-12 h-6 rounded-full relative transition-all ${useGlobalCommission ? 'bg-blue-600' : 'bg-slate-300'}`}
               >
                 <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${useGlobalCommission ? 'left-6.5' : 'left-0.5'}`} />
               </button>
            </div>

            {!useGlobalCommission && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-1">
                  <label className="admin-label">Commission Type</label>
                  <select {...register('commissionType')} className="admin-input">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Fee ($)</option>
                  </select>
                </div>
                <Input label="Override Amount" type="number" {...register('commissionAmount', { valueAsNumber: true })} error={errors.commissionAmount?.message} />
              </div>
            )}
          </Card>

          {/* Section: Media */}
          <Card title="Product Media & Gallery" className={activeSection !== 'media' ? 'hidden' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="admin-label">Main Thumbnail</p>
                <div className="border-2 border-dashed border-slate-200 rounded-sm p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                   <Upload className="text-slate-300 mb-2" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Click to Upload Thumbnail</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="admin-label">Video Content</p>
                <Input label="YouTube URL" placeholder="https://youtube.com/watch?v=..." />
                <div className="border border-slate-200 p-4 rounded-sm bg-slate-50 flex items-center gap-3">
                   <PlaySquare className="text-blue-600" />
                   <div>
                     <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Video Upload (MP4)</p>
                     <p className="text-[9px] text-slate-400 font-medium">Max size: 50MB</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
               <p className="admin-label mb-4">Gallery Images (Max 10)</p>
               <div className="grid grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="aspect-square bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center text-slate-300">
                      <ImageIcon size={20} />
                    </div>
                  ))}
                  <button type="button" className="aspect-square border-2 border-dashed border-slate-200 rounded-sm flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-600 hover:text-blue-600 transition-all">
                     <Plus size={20} />
                  </button>
               </div>
            </div>
          </Card>

          {/* Section: Visibility & Status */}
          <Card title="Product Status & Visibility" className={activeSection !== 'status' ? 'hidden' : ''}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-sm">
                 <div className="flex items-center gap-3">
                   <CheckCircle2 className="text-green-600" />
                   <div>
                     <p className="text-sm font-bold">Publish Product (Live)</p>
                     <p className="text-[10px] text-slate-500 font-medium">Make this product visible to the public.</p>
                   </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => setValue('isLive', !watch('isLive'))}
                   className={`w-12 h-6 rounded-full relative transition-all ${watch('isLive') ? 'bg-green-600' : 'bg-slate-300'}`}
                 >
                   <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${watch('isLive') ? 'left-6.5' : 'left-0.5'}`} />
                 </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-sm">
                 <div className="flex items-center gap-3">
                   <AlertCircle className="text-orange-500" />
                   <div>
                     <p className="text-sm font-bold">Featured Listing</p>
                     <p className="text-[10px] text-slate-500 font-medium">Highlight this product on the home page.</p>
                   </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => setValue('isFeatured', !watch('isFeatured'))}
                   className={`w-12 h-6 rounded-full relative transition-all ${watch('isFeatured') ? 'bg-orange-500' : 'bg-slate-300'}`}
                 >
                   <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${watch('isFeatured') ? 'left-6.5' : 'left-0.5'}`} />
                 </button>
              </div>

              <div className="w-full md:w-1/3">
                <Input label="Inventory Quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </form>
  );
}
