import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast';

interface Props {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
}

export default function MediaUploader({ onUploadComplete, maxFiles = 10, folder = 'products' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previews.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // 1. Get presigned URL
        const { data: presignedData } = await apiClient.post('/upload/presigned-url', {
          fileName: file.name,
          fileType: file.type,
          folder
        });

        // 2. Upload to S3 directly
        await axios.put(presignedData.uploadUrl, file, {
          headers: { 'Content-Type': file.type }
        });

        uploadedUrls.push(presignedData.fileUrl);
        setPreviews(prev => [...prev, presignedData.fileUrl]);
      }

      onUploadComplete(uploadedUrls);
      toast.success('Upload complete');
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // In a real app, you might want to delete from S3 or just update the parent
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {previews.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
            <img src={url} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {previews.length < maxFiles && (
          <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center px-2">
                  Upload Media
                </span>
              </>
            )}
            <input type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,video/*" disabled={uploading} />
          </label>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">
        Max {maxFiles} files • Supports JPG, PNG, MP4 • Max 50MB
      </p>
    </div>
  );
}
