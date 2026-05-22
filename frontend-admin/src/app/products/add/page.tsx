'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { productsService, categoriesService, sellersService, uploadService, settingsService, basketsService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { 
  Package, Image as ImageIcon, Plus, Trash2, 
  ArrowLeft, Save, Loader2, Info, Gavel, 
  Layout, Camera, X, Check, HelpCircle, DollarSign,
  Crown
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Input from '@/components/common/Input';

export default function AddProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    categoryId: '',
    basketId: '',
    sellerId: '',
    quantity: 1,
    condition: 'NEW',
    shortDescription: '',
    description: '',
    basePrice: '',
    status: 'ACTIVE',
    thumbnail: '',
    gallery: [] as string[],
    useGlobalCommission: true,
    commissionEnabled: true,
    commissionType: 'PERCENTAGE',
    commissionAmount: '',
    minCommissionAmount: '',
    maxCommissionAmount: '',
    useGlobalUpfrontPayment: true,
    upfrontPaymentPercentage: '',
    isFeatured: false,
    auction: {
      startingBid: '',
      reservePrice: '',
      buyItNowPrice: '',
      bidIncrement: '10',
      startTime: '',
      endTime: '',
      type: 'BID_AND_BUY'
    }
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: () => categoriesService.findAll({ tree: true })
  });

  const { data: sellersData } = useQuery({
    queryKey: ['admin-sellers-list'],
    queryFn: () => sellersService.findAll()
  });

  const { data: basketsData } = useQuery({
    queryKey: ['admin-baskets-list'],
    queryFn: () => basketsService.findAll({ limit: 100, isActive: 'true' })
  });

  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => settingsService.get('all')
  });

  const globalCommissionEnabled = settingsData?.commission_enabled === true || settingsData?.commission_enabled === 'true';
  const globalCommissionType = settingsData?.commission_type || 'PERCENTAGE';
  const globalCommissionAmount = settingsData?.commission_amount || '0';
  const globalUpfrontPayment = Number(settingsData?.upfront_payment_percentage !== undefined ? settingsData.upfront_payment_percentage : 0);

  // Auto-generate SKU based on title
  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .substring(0, 10);
      
      const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
      setFormData(prev => ({ ...prev, sku: `MT-${slug}-${hash}`.toUpperCase() }));
    }
  }, [formData.title]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => productsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product listed successfully');
      router.push('/products');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to list product');
    },
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading('thumbnail');
      const { uploadUrl, fileUrl } = await uploadService.getPresignedUrl(file.name, file.type, 'products/thumbnails');
      await uploadService.uploadToS3(uploadUrl, file);
      setFormData(prev => ({ ...prev, thumbnail: fileUrl }));
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading('gallery');
      const newUrls: string[] = [];
      for (const file of files) {
        const { uploadUrl, fileUrl } = await uploadService.getPresignedUrl(file.name, file.type, 'products/gallery');
        await uploadService.uploadToS3(uploadUrl, file);
        newUrls.push(fileUrl);
      }
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newUrls] }));
      toast.success(`${files.length} images added to gallery`);
    } catch (err) {
      toast.error('Gallery upload failed');
    } finally {
      setUploading(null);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { thumbnail, gallery, ...rest } = formData;
    
    const payload = {
      ...rest,
      basePrice: Number(formData.basePrice) || 0,
      quantity: Number(formData.quantity) || 1,
      basketId: formData.basketId || null,
      isFeatured: formData.isFeatured,
      commissionAmount: formData.commissionAmount ? Number(formData.commissionAmount) : null,
      minCommissionAmount: formData.minCommissionAmount ? Number(formData.minCommissionAmount) : null,
      maxCommissionAmount: formData.maxCommissionAmount ? Number(formData.maxCommissionAmount) : null,
      useGlobalUpfrontPayment: formData.useGlobalUpfrontPayment,
      upfrontPaymentPercentage: formData.upfrontPaymentPercentage ? Number(formData.upfrontPaymentPercentage) : null,
      media: [
        { url: formData.thumbnail, isPrimary: true, mediaType: 'IMAGE', sortOrder: 0 },
        ...formData.gallery.map((url, i) => ({ url, isPrimary: false, mediaType: 'IMAGE', sortOrder: i + 1 }))
      ],
      auction: {
        ...formData.auction,
        startingBid: Number(formData.auction.startingBid) || 0,
        reservePrice: formData.auction.reservePrice ? Number(formData.auction.reservePrice) : null,
        buyItNowPrice: formData.auction.buyItNowPrice ? Number(formData.auction.buyItNowPrice) : null,
        bidIncrement: Number(formData.auction.bidIncrement) || 0,
      }
    };

    if (!formData.thumbnail) return toast.error('Thumbnail image is required');
    if (!formData.categoryId) return toast.error('Please select a category');
    if (!formData.sellerId) return toast.error('Please select a seller');

    createMutation.mutate(payload);
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
      <HelpCircle size={11} className="text-slate-400 hover:text-blue-500 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[9px] font-medium leading-relaxed rounded-sm z-50 shadow-xl pointer-events-none uppercase tracking-wider">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );

  const auctionType = formData.auction.type;
  const showBidding = auctionType === 'BID_ONLY' || auctionType === 'BID_AND_BUY';
  const showBuyNow = auctionType === 'BUY_NOW_ONLY' || auctionType === 'BID_AND_BUY';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <div>
                 <h1 className="text-xl font-bold text-slate-800 leading-tight">Create New Product</h1>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Inventory Management / Add Item</p>
              </div>
           </div>
           <div className="flex gap-3">
              <Button variant="default" onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5">Discard</Button>
              <Button form="add-product-form" type="submit" variant="primary" className="text-[10px] font-black uppercase tracking-widest px-8 py-2.5 shadow-lg shadow-blue-100" isLoading={createMutation.isPending}>
                <Save size={14} className="mr-2" /> Publish Item
              </Button>
           </div>
        </div>

        <form id="add-product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <Card title="General Information" icon={<Info size={16} className="text-blue-500" />}>
                 <div className="space-y-6">
                    <Input label="Product Title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. 2024 BMW M4 Competition" />
                    <div className="grid grid-cols-2 gap-6">
                       <Input label="SKU / Reference ID" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="MT-2024-BMW-M4" />
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Item Condition</label>
                          <select className="admin-input" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                            <option value="NEW">Brand New</option>
                            <option value="LIKE_NEW">Like New / Mint</option>
                            <option value="USED_GOOD">Used - Good</option>
                            <option value="USED_FAIR">Used - Fair</option>
                            <option value="REFURBISHED">Refurbished</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Short Description</label>
                       <textarea className="admin-input min-h-[80px]" placeholder="A brief summary of the vehicle or item..." value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Specification / Description</label>
                       <textarea className="admin-input min-h-[200px]" placeholder="Detailed features, history, and technical specs..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                 </div>
              </Card>

              <Card title="Inventory & Logistics" icon={<Layout size={16} className="text-amber-500" />}>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assign Category</label>
                       <select className="admin-input" required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                         <option value="">Choose a category...</option>
                         {categoriesData?.map((cat: any) => (
                           <React.Fragment key={cat.id}>
                              <option value={cat.id} className="font-bold">{cat.name}</option>
                              {cat.children?.map((child: any) => (
                                <option key={child.id} value={child.id}>&nbsp;&nbsp;— {child.name}</option>
                              ))}
                           </React.Fragment>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bucket / Event Location</label>
                       <select className="admin-input" value={formData.basketId || ''} onChange={(e) => setFormData({...formData, basketId: e.target.value})}>
                         <option value="">Select Auction Bucket...</option>
                          {basketsData?.items?.map((basket: any) => (
                            <option key={basket.id} value={basket.id}>{basket.name}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assign Seller</label>
                       <select className="admin-input" required value={formData.sellerId} onChange={(e) => setFormData({...formData, sellerId: e.target.value})}>
                         <option value="">Select a verified seller...</option>
                         {sellersData?.map((seller: any) => (
                           <option key={seller.id} value={seller.id}>{seller.companyName || `${seller.user?.firstName} ${seller.user?.lastName}`}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">List Status</label>
                       <select className="admin-input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                         <option value="ACTIVE">Visible & Available</option>
                         <option value="DRAFT">Draft / Hidden</option>
                         <option value="UNAVAILABLE">Unavailable</option>
                       </select>
                    </div>
                    <Input label="Initial Stock Quantity" type="number" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                    
                    <div className="space-y-1 flex items-center justify-between p-3 bg-orange-50/50 border border-orange-200 rounded-sm mt-3 col-span-2">
                       <div className="flex items-center gap-2">
                          <Crown size={14} className="text-orange-500" />
                          <div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Featured Listing</span>
                             <span className="text-[9px] text-slate-400 block font-bold mt-0.5">Highlight this product on the home page dashboard</span>
                          </div>
                       </div>
                       <button 
                         type="button"
                         onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                         className={`w-12 h-6 rounded-full relative transition-all ${formData.isFeatured ? 'bg-orange-500' : 'bg-slate-300'}`}
                       >
                         <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${formData.isFeatured ? 'left-6.5' : 'left-0.5'}`} />
                       </button>
                    </div>
                 </div>
              </Card>

              <Card title="Auction & Pricing Configuration" icon={<Gavel size={16} className="text-blue-600" />}>
                 <div className="space-y-8">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Auction Type
                          <Tooltip text="Select how users can buy this item. Bidding only, direct purchase, or both." />
                       </label>
                       <select className="admin-input" value={formData.auction.type} onChange={(e) => setFormData({...formData, auction: {...formData.auction, type: e.target.value}})}>
                         <option value="BID_ONLY">Bidding Only</option>
                         <option value="BID_AND_BUY">Bid & Buy Now</option>
                         <option value="BUY_NOW_ONLY">Buy Now Only</option>
                       </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {showBidding && (
                         <>
                           <div className="space-y-1">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Starting Bid ($)<Tooltip text="Minimum starting price." /></label>
                             <input type="number" className="admin-input" required={showBidding} value={formData.auction.startingBid} onChange={(e) => setFormData({...formData, auction: {...formData.auction, startingBid: e.target.value}})} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reserve Price ($)<Tooltip text="Hidden minimum acceptable price." /></label>
                             <input type="number" className="admin-input" value={formData.auction.reservePrice} onChange={(e) => setFormData({...formData, auction: {...formData.auction, reservePrice: e.target.value}})} />
                           </div>
                         </>
                       )}
                       {showBuyNow && (
                         <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buy It Now Price ($)<Tooltip text="Immediate purchase price." /></label>
                           <input type="number" className="admin-input" required={showBuyNow} value={formData.auction.buyItNowPrice} onChange={(e) => setFormData({...formData, auction: {...formData.auction, buyItNowPrice: e.target.value}})} />
                         </div>
                       )}
                    </div>

                    {showBidding && (
                       <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-100 rounded-sm">
                          <div className="space-y-1">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auction Start Time<Tooltip text="Start time." /></label>
                             <input type="datetime-local" className="admin-input" required={showBidding} value={formData.auction.startTime} onChange={(e) => setFormData({...formData, auction: {...formData.auction, startTime: e.target.value}})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auction End Time<Tooltip text="End time." /></label>
                             <input type="datetime-local" className="admin-input" required={showBidding} value={formData.auction.endTime} onChange={(e) => setFormData({...formData, auction: {...formData.auction, endTime: e.target.value}})} />
                          </div>
                       </div>
                    )}

                    {showBidding && (
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bid Increment ($)<Tooltip text="Min bid increase." /></label>
                          <input type="number" className="admin-input max-w-[200px]" required={showBidding} value={formData.auction.bidIncrement} onChange={(e) => setFormData({...formData, auction: {...formData.auction, bidIncrement: e.target.value}})} />
                       </div>
                    )}
                 </div>
              </Card>              
              
              {/* Set Buyer's Premium (B.P) Details */}
              <Card title="Set Buyer's Premium (B.P) Details" icon={<DollarSign size={16} className="text-green-600" />}>
                  <div className="space-y-8">
                     <div className="flex items-center gap-6 p-4 bg-slate-50/50 rounded-sm border border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                           <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                             checked={formData.useGlobalCommission}
                             onChange={(e) => setFormData({...formData, useGlobalCommission: e.target.checked})}
                           />
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 group-hover:text-blue-600 transition-colors">
                               Use Global B.P Settings
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                               Global Default: <span className="text-blue-600">{globalCommissionEnabled ? `Enabled (${globalCommissionAmount}${globalCommissionType === 'PERCENTAGE' ? '%' : '$'})` : 'Disabled'}</span>
                             </span>
                           </div>
                        </label>
                     </div>

                     {!formData.useGlobalCommission && (
                       <div className="space-y-6 animate-fade-in">
                         <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buyer's Premium Enabled?</label>
                              <select className="admin-input" value={formData.commissionEnabled ? 'true' : 'false'} onChange={(e) => setFormData({...formData, commissionEnabled: e.target.value === 'true'})}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Premium Type</label>
                              <select className="admin-input" value={formData.commissionType} onChange={(e) => setFormData({...formData, commissionType: e.target.value})}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Fixed Amount ($)</option>
                              </select>
                           </div>
                         </div>

                         <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Premium Fee Amount ({formData.commissionType === 'PERCENTAGE' ? '%' : '$'})</label>
                               <input type="number" className="admin-input" placeholder="0.00" value={formData.commissionAmount} onChange={(e) => setFormData({...formData, commissionAmount: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Min Premium Amount ($)</label>
                               <input type="number" className="admin-input" placeholder="Min" value={formData.minCommissionAmount} onChange={(e) => setFormData({...formData, minCommissionAmount: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Premium Amount ($)</label>
                               <input type="number" className="admin-input" placeholder="Max" value={formData.maxCommissionAmount} onChange={(e) => setFormData({...formData, maxCommissionAmount: e.target.value})} />
                            </div>
                         </div>
                       </div>
                     )}
                  </div>
               </Card>

               {/* Upfront Partial Payment Configuration */}
               <Card title="Upfront Partial Payment" icon={<DollarSign size={16} className="text-emerald-500" />}>
                  <div className="space-y-6">
                     <div className="flex items-center gap-6 p-4 bg-slate-50/50 rounded-sm border border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                           <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                             checked={formData.useGlobalUpfrontPayment}
                             onChange={(e) => setFormData({...formData, useGlobalUpfrontPayment: e.target.checked})}
                           />
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 group-hover:text-emerald-600 transition-colors">
                               Use Global Upfront Payment Settings
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                               Global Default: <span className="text-emerald-600">{globalUpfrontPayment > 0 ? `${globalUpfrontPayment}% Required` : 'Not Required'}</span>
                             </span>
                           </div>
                        </label>
                     </div>
                    
                    {!formData.useGlobalUpfrontPayment && (
                      <div className="grid grid-cols-2 gap-6 animate-fade-in">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upfront Payment Required (%)</label>
                            <input type="number" className="admin-input" placeholder="e.g. 10" value={formData.upfrontPaymentPercentage} onChange={(e) => setFormData({...formData, upfrontPaymentPercentage: e.target.value})} />
                         </div>
                      </div>
                    )}
                 </div>
              </Card>
           </div>

           <div className="space-y-8">
              <Card title="Product Media" icon={<ImageIcon size={16} className="text-pink-500" />}>
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Primary Thumbnail</label>
                       <div className="relative group">
                          <div className={`w-full aspect-video rounded-sm border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${formData.thumbnail ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200 bg-slate-50'}`}>
                             {formData.thumbnail ? <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-slate-400"><Camera size={32} className="mb-2 opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest">Upload Main Image</span></div>}
                             {uploading === 'thumbnail' && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 size={24} className="text-blue-600 animate-spin" /></div>}
                          </div>
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailUpload} disabled={!!uploading} />
                       </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-slate-50">
                       <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gallery Images</label><span className="text-[10px] font-bold text-slate-400 uppercase">{formData.gallery.length} Images</span></div>
                       <div className="grid grid-cols-3 gap-3">
                          {formData.gallery.map((url, i) => (
                            <div key={url} className="relative aspect-square rounded-sm border border-slate-200 overflow-hidden group">
                               <img src={url} alt="" className="w-full h-full object-cover" />
                               <button onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X size={10} /></button>
                            </div>
                          ))}
                          <label className="aspect-square rounded-sm border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                             {uploading === 'gallery' ? <Loader2 size={16} className="text-slate-400 animate-spin" /> : <><Plus size={16} className="text-slate-400" /><span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mt-1">Add</span></>}
                             <input type="file" multiple className="hidden" onChange={handleGalleryUpload} disabled={!!uploading} />
                          </label>
                       </div>
                    </div>
                 </div>
              </Card>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-sm">
                 <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-blue-600" /><span className="text-[10px] font-black uppercase tracking-widest text-blue-800">Quality Checklist</span></div>
                 <ul className="space-y-2">
                    <li className="text-[9px] text-blue-700 font-bold uppercase flex items-center gap-2"><Check size={10} /> High resolution photography</li>
                    <li className="text-[9px] text-blue-700 font-bold uppercase flex items-center gap-2"><Check size={10} /> Accurate technical description</li>
                    <li className="text-[9px] text-blue-700 font-bold uppercase flex items-center gap-2"><Check size={10} /> Realistic reserve price</li>
                 </ul>
              </div>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
