'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createAdminService, uploadService } from '@/services/admin.service';
import { ShoppingBag, ArrowLeft, ImagePlus, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { ADMIN_CONSTANTS } from '@/constants/app.constants';

const basketsService = createAdminService('baskets');

export default function AddBucketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => basketsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-baskets'] });
      toast.success('Bucket created successfully');
      router.push('/baskets');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Something went wrong'),
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      name: val,
      slug: val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const { uploadUrl, fileUrl } = await uploadService.getPresignedUrl(
        file.name,
        file.type,
        ADMIN_CONSTANTS.UPLOAD.S3_FOLDERS.BASKETS
      );
      await uploadService.uploadToS3(uploadUrl, file);
      setForm((f) => ({ ...f, image: fileUrl }));
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Bucket name is required');
    if (!form.slug.trim()) return toast.error('Slug is required');
    mutation.mutate(form);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/baskets')}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-sm transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-sm">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-slate-800">Create Bucket</h1>
                <p className="text-[10px] text-slate-400 font-medium">Add a new event or location group collection.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card title="Bucket Details" icon={<ShoppingBag size={16} className="text-blue-500" />}>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                    Bucket Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Auction in Miami"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input font-mono"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="e.g. auction-in-miami"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Auto-generated from name. Edit if needed.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    className="admin-input resize-none min-h-[120px]"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Provide a detailed description of this bucket's items..."
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column / Sidebar */}
          <div className="space-y-6">
            <Card title="Bucket Image" icon={<ImagePlus size={16} className="text-indigo-500" />}>
              <div className="space-y-4 text-center">
                <div className="w-full h-44 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group">
                  {form.image ? (
                    <>
                      <img src={form.image} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image: '' }))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-bold uppercase tracking-wider"
                      >
                        Remove Image
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <ImagePlus size={28} className="text-slate-300 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Image Uploaded</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors w-full">
                    <ImagePlus size={14} />
                    {imageUploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                    />
                  </label>
                  <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-wider leading-relaxed">
                    PNG, JPG, WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Publish Status">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Status</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                    {form.isActive ? 'Visible on website' : 'Hidden from website'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`transition-colors ${
                    form.isActive ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-slate-400'
                  }`}
                >
                  {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                type="submit"
                className="w-full uppercase tracking-widest text-xs font-black py-3 justify-center"
                isLoading={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" /> Save Bucket
              </Button>
              <Button
                variant="default"
                type="button"
                onClick={() => router.push('/baskets')}
                className="w-full uppercase tracking-widest text-xs font-black py-3 justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
