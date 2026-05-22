'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { categoriesService, uploadService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { 
  Layers, Image as ImageIcon, Plus, 
  ArrowLeft, Save, Loader2, Info, Camera, X, Check
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Input from '@/components/common/Input';

export default function AddCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: '',
    isActive: true
  });

  // Fetch flat categories list for Parent Category dropdown selection
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-flat'],
    queryFn: () => categoriesService.findAll()
  });

  // Slug generator helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Sync Name to Slug
  useEffect(() => {
    if (!isSlugManuallyEdited) {
      setFormData(prev => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [formData.name, isSlugManuallyEdited]);

  // Handle S3 Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      // Get S3 presigned URL for categories folder
      const { uploadUrl, fileUrl } = await uploadService.getPresignedUrl(file.name, file.type, 'categories');
      // Upload directly to S3
      await uploadService.uploadToS3(uploadUrl, file);
      setFormData(prev => ({ ...prev, imageUrl: fileUrl }));
      toast.success('Image uploaded to S3 successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Image upload to S3 failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => categoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-flat'] });
      toast.success('Category created successfully');
      router.push('/categories');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Category Name is required');
    if (!formData.slug.trim()) return toast.error('Category Slug is required');

    const payload = {
      ...formData,
      parentId: formData.parentId === '' ? null : formData.parentId
    };

    createMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top bar with Actions */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => router.back()} 
                className="p-2 bg-white border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                 <h1 className="text-xl font-bold text-slate-800 leading-tight">Create New Category</h1>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Taxonomy Management / Add Category</p>
              </div>
           </div>
           <div className="flex gap-3">
              <Button 
                type="button"
                variant="default" 
                onClick={() => router.back()} 
                className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5"
              >
                Discard
              </Button>
              <Button 
                form="add-category-form" 
                type="submit" 
                variant="primary" 
                className="text-[10px] font-black uppercase tracking-widest px-8 py-2.5 shadow-lg shadow-blue-100" 
                isLoading={createMutation.isPending}
              >
                <Save className="w-3.5 h-3.5 mr-2" /> Save Category
              </Button>
           </div>
        </div>

        {/* Form Body */}
        <form id="add-category-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <Card title="Category Information" icon={<Info size={16} className="text-blue-500" />}>
                 <div className="space-y-6">
                    <Input 
                      label="Category Name *" 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Vintage Motorcycles, Accessories" 
                    />

                    <Input 
                      label="Category Slug *" 
                      required 
                      value={formData.slug} 
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true);
                        setFormData({...formData, slug: slugify(e.target.value)});
                      }} 
                      placeholder="e.g. vintage-motorcycles" 
                      helpText="Unique URL-friendly identifier. Auto-generated from name if untouched."
                    />

                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Parent Category</label>
                       <select 
                         className="admin-input" 
                         value={formData.parentId} 
                         onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                       >
                         <option value="">None (Top-Level Category)</option>
                         {categoriesData?.items?.map((cat: any) => (
                           <option key={cat.id} value={cat.id}>
                             {cat.name}
                           </option>
                         ))}
                       </select>
                       <p className="text-[0.7rem] text-slate-500 font-medium">Select a parent category if this should be nested as a subcategory.</p>
                    </div>

                    <Input 
                      label="Description" 
                      multiline
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Short details about what kind of products fit into this category..." 
                    />
                 </div>
              </Card>

              {/* Status Section */}
              <Card title="Settings" icon={<Layers size={16} className="text-amber-500" />}>
                 <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-sm">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                         checked={formData.isActive}
                         onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                       />
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                           Category is Active
                         </span>
                         <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                           If checked, this category and its products will be visible on the public website.
                         </span>
                       </div>
                    </label>
                 </div>
              </Card>
           </div>

           {/* Media / S3 Image Upload */}
           <div className="space-y-8">
              <Card title="Category Image" icon={<ImageIcon size={16} className="text-pink-500" />}>
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Cover / Icon Image</label>
                       
                       {formData.imageUrl ? (
                         <div className="relative group rounded-sm border border-slate-200 overflow-hidden aspect-video">
                            <img src={formData.imageUrl} alt="Category Icon" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                               <button 
                                 type="button"
                                 onClick={removeImage} 
                                 className="p-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors shadow-lg"
                                 title="Delete Image"
                               >
                                 <X size={14} />
                               </button>
                            </div>
                         </div>
                       ) : (
                         <div className="relative group">
                            <div className={`w-full aspect-video rounded-sm border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${uploading ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                               {uploading ? (
                                 <div className="flex flex-col items-center text-blue-600">
                                   <Loader2 size={32} className="mb-2 animate-spin" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Uploading to S3...</span>
                                 </div>
                               ) : (
                                 <div className="flex flex-col items-center text-slate-400">
                                   <Camera size={32} className="mb-2 opacity-50" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Upload Cover Image</span>
                                 </div>
                               )}
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={handleImageUpload} 
                              disabled={uploading} 
                            />
                         </div>
                       )}
                       
                       {/* Manual URL Input */}
                       <div className="pt-3 border-t border-slate-100">
                          <Input
                            label="Or Paste Direct Image URL"
                            placeholder="https://..."
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>
              </Card>

              {/* Checklist */}
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-sm">
                 <div className="flex items-center gap-2 mb-2">
                   <Info className="w-4 h-4 text-blue-600" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-800">Taxonomy Best Practices</span>
                 </div>
                 <ul className="space-y-2">
                    <li className="text-[9px] text-blue-700 font-bold uppercase flex items-center gap-2">
                      <Check size={10} className="shrink-0" /> Use clear, singular/plural names (e.g. Motorcycles)
                    </li>
                    <li className="text-[9px] text-blue-700 font-bold uppercase flex items-center gap-2">
                      <Check size={10} className="shrink-0" /> Slug is URL-friendly and lowercase
                    </li>
                    <li className="text-[9px] text-blue-700 font-bold uppercase flex items-center gap-2">
                      <Check size={10} className="shrink-0" /> S3 image represents the inventory perfectly
                    </li>
                 </ul>
              </div>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
