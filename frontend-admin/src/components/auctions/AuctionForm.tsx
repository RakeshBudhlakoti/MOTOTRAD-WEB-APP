'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Upload, Trash, Check, X, 
  Type, FileText, Image as ImageIcon, 
  Layout, Send, Trash2, Trophy, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

const storySchema = z.object({
  title: z.string().min(3, 'Title is required'),
  shortDescription: z.string().optional(),
  fullNarrative: z.string().optional(),
  challenge: z.string().optional(),
  motivation: z.string().optional(),
  achievement: z.string().optional(),
  takeaways: z.string().optional(),
  category: z.string().optional(),
  isTopPick: z.boolean(),
  isExclusive: z.boolean(),
});

interface StoryFormData {
  title: string;
  shortDescription?: string;
  fullNarrative?: string;
  challenge?: string;
  motivation?: string;
  achievement?: string;
  takeaways?: string;
  category?: string;
  isTopPick: boolean;
  isExclusive: boolean;
}

interface AuctionFormProps {
  initialData?: any;
  onSubmit: (data: StoryFormData) => void;
  isLoading?: boolean;
}

export default function AuctionForm({ initialData, onSubmit, isLoading }: AuctionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: initialData || {
      title: '',
      isTopPick: false,
      isExclusive: false,
    },
  });

  const isExclusive = watch('isExclusive');
  const isTopPick = watch('isTopPick');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Column: Story Content & Highlights */}
        <div className="flex-1 space-y-8">
          {/* Story Content Card */}
          <div className="bg-white rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-[1.1rem] font-black text-[#111] uppercase tracking-tight">Story Content</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1">Story Title <span className="text-primary">*</span></label>
                <input 
                  {...register('title')}
                  className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none focus:border-primary/20 transition-all"
                  placeholder="Enter a compelling title..."
                />
                {errors.title && <p className="text-xs text-primary font-bold px-1">{errors.title.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1">Short Description / Hook</label>
                <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-3xl overflow-hidden focus-within:border-primary/20 transition-all">
                   <div className="bg-white border-b border-[#F1F5F9] p-3 flex gap-4">
                      {['B', 'I', 'U', 'S', 'L', 'O'].map((tool) => (
                        <button key={tool} type="button" className="w-8 h-8 rounded-lg hover:bg-slate-50 text-[0.8rem] font-black text-slate-400">{tool}</button>
                      ))}
                   </div>
                   <textarea 
                    {...register('shortDescription')}
                    rows={4}
                    className="w-full bg-transparent p-6 font-bold text-[#111] outline-none resize-none"
                    placeholder="A brief hook for the story feed..."
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1">Full Narrative <span className="text-primary">*</span></label>
                <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-3xl overflow-hidden focus-within:border-primary/20 transition-all">
                   <div className="bg-white border-b border-[#F1F5F9] p-3 flex gap-4">
                      {['B', 'I', 'U', 'S', 'L', 'O'].map((tool) => (
                        <button key={tool} type="button" className="w-8 h-8 rounded-lg hover:bg-slate-50 text-[0.8rem] font-black text-slate-400">{tool}</button>
                      ))}
                   </div>
                   <textarea 
                    {...register('fullNarrative')}
                    rows={12}
                    className="w-full bg-transparent p-6 font-bold text-[#111] outline-none resize-none"
                    placeholder="The core story of the athlete's journey..."
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Highlights Card */}
          <div className="bg-white rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-[1.1rem] font-black text-[#111] uppercase tracking-tight">Editorial Highlights</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1 text-emerald-500">The Challenge</label>
                    <textarea {...register('challenge')} className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none h-40 resize-none" placeholder="Overcoming obstacles..." />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1 text-blue-500">The Motivation</label>
                    <textarea {...register('motivation')} className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none h-40 resize-none" placeholder="What drives them..." />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1 text-yellow-500">The Achievement</label>
                 <textarea {...register('achievement')} className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none h-32 resize-none" placeholder="The ultimate victory..." />
              </div>
              <div className="space-y-3">
                 <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1 text-primary">Editorial Takeaways</label>
                 <textarea {...register('takeaways')} className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none h-32 resize-none" placeholder="Key highlights for front-page promotion..." />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Media & Publish */}
        <div className="w-full xl:w-[400px] space-y-8">
          {/* Cover Media Card */}
          <div className="bg-white rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between">
              <h3 className="text-[0.9rem] font-black text-[#111] uppercase tracking-tight">Cover Media</h3>
              <div className="flex gap-2">
                 <ImageIcon className="w-4 h-4 text-slate-400" />
                 <Layout className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="p-8">
               <div className="border-2 border-dashed border-slate-100 rounded-[32px] p-10 flex flex-col items-center justify-center bg-[#F8FAFC] group cursor-pointer hover:border-primary/20 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-[0.75rem] font-black text-[#111] uppercase tracking-widest mb-1">Upload Cover</p>
               </div>
            </div>
          </div>

          {/* Publish Card */}
          <div className="bg-white rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#F1F5F9]">
              <h3 className="text-[0.9rem] font-black text-[#111] uppercase tracking-tight">Publish</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                <select 
                  {...register('category')}
                  className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl px-6 py-4 font-bold text-[#111] outline-none focus:border-primary/20 transition-all appearance-none"
                >
                  <option value="MINDSET">Mindset</option>
                  <option value="TRAINING">Training</option>
                  <option value="NUTRITION">Nutrition</option>
                </select>
              </div>

              <div className="space-y-4">
                 <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative">
                       <input 
                        type="checkbox" 
                        {...register('isTopPick')}
                        className="sr-only peer" 
                       />
                       <div className="w-12 h-6 bg-slate-100 rounded-full peer peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                    </div>
                    <div>
                       <p className="text-[0.8rem] font-black text-[#111] uppercase tracking-tight leading-none mb-1">Admin's Top 8 Pick</p>
                       <p className="text-[0.65rem] font-bold text-slate-400 uppercase">Highlight this on the home page</p>
                    </div>
                 </label>

                 <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative">
                       <input 
                        type="checkbox" 
                        {...register('isExclusive')}
                        className="sr-only peer" 
                       />
                       <div className="w-12 h-6 bg-slate-100 rounded-full peer peer-checked:bg-purple-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                    </div>
                    <div>
                       <p className="text-[0.8rem] font-black text-[#111] uppercase tracking-tight leading-none mb-1">Exclusive Content</p>
                       <p className="text-[0.65rem] font-bold text-slate-400 uppercase">Premium access only</p>
                    </div>
                 </label>
              </div>

              <div className="pt-8 border-t border-[#F1F5F9] space-y-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-100 text-emerald-600 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-200 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                  Publish Story
                </button>
                <button 
                  type="button"
                  className="w-full py-4 bg-white border border-[#F1F5F9] text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:text-primary transition-all flex items-center justify-center gap-3"
                >
                  <Trash2 className="w-5 h-5" />
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
