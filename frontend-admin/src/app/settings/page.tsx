'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { settingsService, uploadService } from '@/services/admin.service';
import { 
  Settings, 
  Globe, 
  Mail, 
  DollarSign, 
  CreditCard, 
  Gavel, 
  Save, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Database,
  Lock,
  ChevronRight,
  HelpCircle,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Swal from 'sweetalert2';

const TABS = [
  { id: 'website', label: 'Website Settings', icon: Globe },
  { id: 'smtp', label: 'SMTP / Email', icon: Mail },
  { id: 'commission', label: 'Global Commission', icon: DollarSign },
  { id: 'paypal', label: 'PayPal Gateway', icon: CreditCard },
  { id: 'auction', label: 'Auction Logic', icon: Gavel },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserRole = currentUser?.role?.name?.toUpperCase();
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SUPERADMIN' || currentUserRole?.includes('SUPER');

  const tabs = [
    { id: 'website', label: 'Website Settings', icon: Globe },
    { id: 'smtp', label: 'SMTP / Email', icon: Mail },
    { id: 'commission', label: 'Global Commission', icon: DollarSign },
    { id: 'paypal', label: 'PayPal Gateway', icon: CreditCard },
    { id: 'auction', label: 'Auction Logic', icon: Gavel },
  ];

  if (isSuperAdmin) {
    tabs.push({ id: 'database', label: 'Clean Database', icon: Database });
  }

  const [activeTab, setActiveTab] = useState('website');
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deletedSummary, setDeletedSummary] = useState<Record<string, number> | null>(null);

  const { data: dbStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-db-stats'],
    queryFn: () => settingsService.get('db-stats'),
    enabled: activeTab === 'database' && isSuperAdmin,
  });

  const cleanMutation = useMutation({
    mutationFn: () => settingsService.post('db-clean', {}),
    onSuccess: (data: any) => {
      setDeletedSummary(data.deleted || {});
      queryClient.invalidateQueries({ queryKey: ['admin-db-stats'] });
      toast.success('Database cleaned successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to clean database');
    }
  });

  const formatTableKey = (key: string) => {
    const mappings: Record<string, string> = {
      trackingEvents: 'Tracking Events',
      shippings: 'Shippings & Deliveries',
      payments: 'Payments & Transactions',
      orders: 'Customer Orders',
      bids: 'Bids Placed',
      auctionExtensions: 'Auction Extensions',
      auctions: 'Auctions Created',
      productMedia: 'Product Media Files',
      productAttributeValues: 'Product Custom Attributes',
      products: 'Products Registered',
      watchlists: 'Watchlists & Favorites',
      sellerKycs: 'Seller KYC Uploads',
      sellerProfiles: 'Seller Profile Records',
      subscriptionPayments: 'Subscription Payments',
      subscriptions: 'User Subscriptions',
      notifications: 'Alerts & Notifications',
      reports: 'Inappropriate Content Reports',
      contactInquiries: 'Support Ticket Inquiries',
      auditLogs: 'Audit Activity Logs (Excl. Active)',
      users: 'Users (Excluding Superadmins)',
      baskets: 'Baskets / Buckets',
      categoryAttributes: 'Category Attributes',
      categories: 'Categories & Subcategories',
    };
    return mappings[key] || key.replace(/([A-Z])/g, ' $1');
  };

  const handleTriggerWipe = () => {
    Swal.fire({
      title: 'CRITICAL ACTION REQUIRED',
      html: `
        <div class="text-left space-y-3 font-sans">
          <p class="text-xs font-black uppercase text-red-600 tracking-wider">Warning: This action is permanent and completely irreversible!</p>
          <p class="text-[11px] leading-relaxed text-slate-500 font-medium">This will permanently delete all auctions, bids, products, categories, non-superadmin user accounts, payments, and history logs.</p>
          <p class="text-[11px] leading-relaxed text-slate-700 font-bold">Please type <span class="bg-slate-100 text-red-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono">CLEAN</span> in the input box below to authorize the database wipe:</p>
        </div>
      `,
      input: 'text',
      inputPlaceholder: 'CLEAN',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'AUTHORIZE DATABASE WIPE',
      cancelButtonText: 'CANCEL',
      customClass: {
        confirmButton: 'uppercase font-black text-xs tracking-widest px-4 py-2.5 rounded-sm',
        cancelButton: 'uppercase font-black text-xs tracking-widest px-4 py-2.5 rounded-sm',
      },
      inputValidator: (value) => {
        if (value !== 'CLEAN') {
          return 'You must type CLEAN to proceed!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value === 'CLEAN') {
        cleanMutation.mutate();
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingKey(key);
      const { uploadUrl, fileUrl } = await uploadService.getPresignedUrl(file.name, file.type, 'settings');
      const uploadRes = await uploadService.uploadToS3(uploadUrl, file);
      if (!uploadRes.ok) throw new Error('Failed to upload to S3');

      setFormData(prev => ({ ...prev, [key]: fileUrl }));
      toast.success(`${key === 'site_logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to upload ${key === 'site_logo' ? 'logo' : 'favicon'}`);
    } finally {
      setUploadingKey(null);
    }
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => settingsService.get('all'),
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsService.post('bulk', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (err: any) => toast.error('Error saving settings')
  });

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
      <HelpCircle size={11} className="text-slate-400 hover:text-blue-500 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[9px] font-medium leading-relaxed rounded-sm z-50 shadow-xl pointer-events-none uppercase tracking-wider text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );

  if (isLoading) return <DashboardLayout><div className="p-20 text-center font-bold text-xs uppercase tracking-widest text-slate-400">Loading configurations...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-white border border-slate-200 text-slate-400">
              <Settings size={20} />
           </div>
           <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">General Settings</h1>
              <p className="text-xs text-slate-500 font-medium">Configure platform core logic, credentials, and business rules.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vertical Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-l-4 ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 border-blue-700 text-white shadow-md' 
                    : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={14} />
                  {tab.label}
                </div>
                {activeTab === tab.id && <ChevronRight size={14} />}
              </button>
            ))}

            <div className="mt-8 p-5 bg-slate-800 text-white rounded-sm">
               <Lock size={24} className="text-blue-400 mb-2" />
               <p className="text-[9px] font-black uppercase tracking-[2px] opacity-60">Security Protocol</p>
               <p className="text-[10px] font-medium mt-2 leading-relaxed opacity-80">Sensitive credentials are encrypted and all changes are recorded in the audit log.</p>
            </div>
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-3">
            {activeTab === 'database' ? (
              <Card title="Database Maintenance">
                <div className="min-h-[400px]">
                  {deletedSummary ? (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest">Database Clean Completed Successfully</h4>
                          <p className="text-[10px] mt-1 font-medium text-emerald-600 uppercase">The database was wiped and reset. All transactional records have been removed.</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deleted Records Summary</span>
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Audit Log Updated</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {Object.entries(deletedSummary).map(([key, count]) => (
                            <div key={key} className="px-4 py-3 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase tracking-wider">{formatTableKey(key)}</span>
                              <span className="font-black text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={() => { setDeletedSummary(null); refetchStats(); }} className="px-6 py-2 uppercase tracking-widest text-xs font-black">
                          Acknowledge & Refresh
                        </Button>
                      </div>
                    </div>
                  ) : isLoadingStats ? (
                    <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                      Scanning database statistics...
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Warning Card */}
                      <div className="p-5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-widest">Crucial Action Warning</h4>
                          <p className="text-[10px] leading-relaxed font-medium text-amber-700 uppercase">
                            Wiping the database is an irreversible administrative action. All products, categories, bids, auctions, orders, kycs, and transactional history will be permanently deleted.
                          </p>
                          <p className="text-[10px] leading-relaxed font-bold text-amber-800 uppercase mt-2">
                            ✓ Preserved: All Superadministrator accounts, role permissions configuration, and global website setting values will not be deleted.
                          </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Database Record Census</span>
                          <button type="button" onClick={() => refetchStats()} className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                            Refresh Counts
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {dbStats && Object.entries(dbStats).map(([key, count]) => (
                            <div key={key} className="px-4 py-3 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase tracking-wider">{formatTableKey(key)}</span>
                              <span className={`font-black px-2.5 py-0.5 rounded-sm ${count === 0 ? 'text-slate-400 bg-slate-50' : 'text-blue-700 bg-blue-50 border border-blue-100'}`}>
                                {count as number}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clean Trigger Button */}
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button 
                          type="button" 
                          onClick={handleTriggerWipe} 
                          className="bg-red-600 hover:bg-red-700 border-red-700 text-white px-8 py-3 uppercase tracking-widest text-xs font-black"
                          isLoading={cleanMutation.isPending}
                        >
                          Wipe Database Data
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <form onSubmit={onSave}>
                 <Card 
                   title={`${tabs.find(t=>t.id===activeTab)?.label} Configuration`}
                   footer={
                     <div className="flex justify-end">
                       <Button type="submit" className="px-8 py-2.5 uppercase tracking-[2px] text-[10px] font-black" isLoading={updateMutation.isPending}>
                          <Save size={14} className="mr-2" /> Save Global Settings
                       </Button>
                     </div>
                   }
                 >
                   <div className="min-h-[400px]">
                      {activeTab === 'website' && (
                        <div className="space-y-6 animate-fade-in">
                          {/* Sub Tabs Pill Header */}
                          <div className="flex flex-wrap gap-2 p-1 bg-slate-50 border border-slate-200/60 mb-6 rounded-lg max-w-fit">
                            <button
                              type="button"
                              onClick={() => setActiveSubTab('general')}
                              className={`px-4 py-2 text-[9px] font-black uppercase tracking-[1.5px] rounded-md transition-all ${
                                activeSubTab === 'general'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              General Info
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubTab('contact')}
                              className={`px-4 py-2 text-[9px] font-black uppercase tracking-[1.5px] rounded-md transition-all ${
                                activeSubTab === 'contact'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              Contact Details
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubTab('social')}
                              className={`px-4 py-2 text-[9px] font-black uppercase tracking-[1.5px] rounded-md transition-all ${
                                activeSubTab === 'social'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              Social Links
                            </button>
                          </div>

                          {/* Sub Tab Content */}
                          <div>
                            {activeSubTab === 'general' && (
                              <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Input label={<>Site Title <Tooltip text="The main name of your platform." /></>} value={formData.site_title || ''} onChange={(e) => handleInputChange('site_title', e.target.value)} />
                                  <Input label={<>Site Tagline <Tooltip text="A short description of your platform." /></>} value={formData.site_tagline || ''} onChange={(e) => handleInputChange('site_tagline', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logo Image <Tooltip text="Upload or enter URL to your platform's main logo image." /></label>
                                    <div className="flex gap-3 items-center">
                                      {formData.site_logo && formData.site_logo.trim() !== '' && (
                                        <div className="h-12 w-20 flex items-center justify-center bg-slate-900 border border-slate-200/80 rounded-lg overflow-hidden shrink-0 shadow-sm relative group">
                                          <img 
                                            src={formData.site_logo} 
                                            alt="Logo Preview" 
                                            className="h-full w-full object-contain p-1" 
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 flex gap-2">
                                        <input 
                                          type="text" 
                                          className="admin-input flex-1" 
                                          placeholder="Logo URL" 
                                          value={formData.site_logo || ''} 
                                          onChange={(e) => handleInputChange('site_logo', e.target.value)} 
                                        />
                                        <label className={`px-4 py-3 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${uploadingKey === 'site_logo' ? 'opacity-60 pointer-events-none' : ''}`}>
                                          {uploadingKey === 'site_logo' ? (
                                            <>
                                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                              <span>Uploading...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-3.5 h-3.5" />
                                              <span>Upload</span>
                                            </>
                                          )}
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={(e) => handleLogoUpload(e, 'site_logo')} 
                                            disabled={uploadingKey === 'site_logo'} 
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Favicon Image <Tooltip text="Upload or enter URL to the browser tab icon." /></label>
                                    <div className="flex gap-3 items-center">
                                      {formData.site_favicon && formData.site_favicon.trim() !== '' && (
                                        <div className="h-12 w-12 flex items-center justify-center bg-white border border-slate-200/80 rounded-lg overflow-hidden shrink-0 shadow-sm relative">
                                          <img 
                                            src={formData.site_favicon} 
                                            alt="Favicon Preview" 
                                            className="h-full w-full object-contain p-2" 
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 flex gap-2">
                                        <input 
                                          type="text" 
                                          className="admin-input flex-1" 
                                          placeholder="Favicon URL" 
                                          value={formData.site_favicon || ''} 
                                          onChange={(e) => handleInputChange('site_favicon', e.target.value)} 
                                        />
                                        <label className={`px-4 py-3 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${uploadingKey === 'site_favicon' ? 'opacity-60 pointer-events-none' : ''}`}>
                                          {uploadingKey === 'site_favicon' ? (
                                            <>
                                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                              <span>Uploading...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-3.5 h-3.5" />
                                              <span>Upload</span>
                                            </>
                                          )}
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*,image/x-icon,image/png" 
                                            onChange={(e) => handleLogoUpload(e, 'site_favicon')} 
                                            disabled={uploadingKey === 'site_favicon'} 
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Input label={<>System Admin Email <Tooltip text="Primary contact for system notifications." /></>} value={formData.admin_email || ''} onChange={(e) => handleInputChange('admin_email', e.target.value)} type="email" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Input label={<>Default Page Size <Tooltip text="Default number of items per page in listings." /></>} type="number" value={formData.default_page_size || ''} onChange={(e) => handleInputChange('default_page_size', e.target.value)} />
                                  <Input label={<>Max Page Size <Tooltip text="Maximum allowed items per page." /></>} type="number" value={formData.max_page_size || ''} onChange={(e) => handleInputChange('max_page_size', e.target.value)} />
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                  <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                                    <h3 className="text-sm font-bold text-slate-800">Subscription Pricing</h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label={<>Pro Membership Fee ($) <Tooltip text="The recurring amount charged for Pro access." /></>} 
                                        type="number" 
                                        value={formData.membership_fee || ''} 
                                        onChange={(e) => handleInputChange('membership_fee', e.target.value)} 
                                        placeholder="5.00"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeSubTab === 'contact' && (
                              <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <Input label={<>Contact No <Tooltip text="Primary customer contact phone number." /></>} value={formData.support_phone || ''} onChange={(e) => handleInputChange('support_phone', e.target.value)} />
                                  <Input label={<>Support Email <Tooltip text="The customer support email address." /></>} value={formData.support_email || ''} onChange={(e) => handleInputChange('support_email', e.target.value)} type="email" />
                                  <Input label={<>Address <Tooltip text="Physical office address or support mail destination." /></>} value={formData.site_address || ''} onChange={(e) => handleInputChange('site_address', e.target.value)} />
                                </div>
                              </div>
                            )}

                            {activeSubTab === 'social' && (
                              <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Input label={<>Facebook URL <Tooltip text="Link to your brand's Facebook page." /></>} value={formData.social_facebook || ''} onChange={(e) => handleInputChange('social_facebook', e.target.value)} />
                                  <Input label={<>Instagram URL <Tooltip text="Link to your brand's Instagram profile." /></>} value={formData.social_instagram || ''} onChange={(e) => handleInputChange('social_instagram', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Input label={<>Twitter URL <Tooltip text="Link to your brand's Twitter/X profile." /></>} value={formData.social_twitter || ''} onChange={(e) => handleInputChange('social_twitter', e.target.value)} />
                                  <Input label={<>Pinterest URL <Tooltip text="Link to your brand's Pinterest page." /></>} value={formData.social_pinterest || ''} onChange={(e) => handleInputChange('social_pinterest', e.target.value)} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {activeTab === 'smtp' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 mb-6">
                           <div className="md:col-span-2">
                             <p className="text-xs font-bold text-slate-800">Email Gateway Mode</p>
                             <p className="text-[10px] text-slate-500 font-medium">Switch between testing and live mail environments.</p>
                           </div>
                           <div className="flex gap-1">
                              {['SANDBOX', 'LIVE'].map(m => (
                                <button key={m} type="button" onClick={() => handleInputChange('smtp_mode', m)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${formData.smtp_mode === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                  {m}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label={<>SMTP Host <Tooltip text="Hostname of your email provider (e.g., smtp.gmail.com)." /></>} value={formData.smtp_host || ''} onChange={(e) => handleInputChange('smtp_host', e.target.value)} />
                          <Input label={<>SMTP Port <Tooltip text="Port used for SMTP (usually 587 or 465)." /></>} value={formData.smtp_port || ''} onChange={(e) => handleInputChange('smtp_port', e.target.value)} type="number" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label={<>SMTP Username <Tooltip text="Email address used for authentication." /></>} value={formData.smtp_user || ''} onChange={(e) => handleInputChange('smtp_user', e.target.value)} />
                          <div className="relative">
                            <Input label={<>SMTP Password <Tooltip text="App password or standard password for the email." /></>} value={formData.smtp_pass || ''} onChange={(e) => handleInputChange('smtp_pass', e.target.value)} type={showSecrets['smtp_pass'] ? 'text' : 'password'} />
                            <button type="button" onClick={() => toggleSecret('smtp_pass')} className="absolute right-3 top-[34px] text-slate-300">
                              {showSecrets['smtp_pass'] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                          <Input label={<>From Name <Tooltip text="Name displayed to recipients (e.g., Mototrad Marketplace)." /></>} value={formData.email_from_name || ''} onChange={(e) => handleInputChange('email_from_name', e.target.value)} placeholder="Mototrad Marketplace" />
                          <Input label={<>From Email <Tooltip text="The default sender email address." /></>} value={formData.email_from_email || ''} onChange={(e) => handleInputChange('email_from_email', e.target.value)} type="email" placeholder="no-reply@mototrad.com" />
                        </div>
                        <Input label={<>Support URL <Tooltip text="Link to your support/helpdesk page." /></>} value={formData.email_support_url || ''} onChange={(e) => handleInputChange('email_support_url', e.target.value)} placeholder="https://mototrad.com/support" />
                      </div>
                    )}

                    {activeTab === 'commission' && (
                      <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buyer's Premium Enabled? <Tooltip text="Activate global commission fees on all sales." /></label>
                              <select className="admin-input" value={formData.commission_enabled === 'true' || formData.commission_enabled === true ? 'true' : 'false'} onChange={(e) => handleInputChange('commission_enabled', e.target.value === 'true')}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Premium Type <Tooltip text="Choose whether to charge a percentage or a flat fee." /></label>
                              <select className="admin-input" value={formData.commission_type || 'PERCENTAGE'} onChange={(e) => handleInputChange('commission_type', e.target.value)}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Fixed Amount ($)</option>
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Premium Fee Amount ({formData.commission_type === 'PERCENTAGE' ? '%' : '$'}) <Tooltip text="The base amount or percentage to charge." /></label>
                              <input type="number" className="admin-input" placeholder="0.00" value={formData.commission_amount || ''} onChange={(e) => handleInputChange('commission_amount', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Min Premium Amount ($) <Tooltip text="The minimum fee regardless of percentage." /></label>
                              <input type="number" className="admin-input" placeholder="Min" value={formData.min_commission_amount || ''} onChange={(e) => handleInputChange('min_commission_amount', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Premium Amount ($) <Tooltip text="The absolute maximum fee charged." /></label>
                              <input type="number" className="admin-input" placeholder="Max" value={formData.max_commission_amount || ''} onChange={(e) => handleInputChange('max_commission_amount', e.target.value)} />
                           </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upfront Payment Required (%) <Tooltip text="Minimum percentage required upfront for Won Bids or Buy Now." /></label>
                                <input type="number" className="admin-input" placeholder="e.g. 10" value={formData.upfront_payment_percentage || ''} onChange={(e) => handleInputChange('upfront_payment_percentage', e.target.value)} />
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'paypal' && (
                      <div className="space-y-6">
                        <div className="flex gap-1 mb-8">
                           {['sandbox', 'live'].map(mode => (
                             <button key={mode} type="button" onClick={() => handleInputChange('paypal_mode', mode)} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-2 transition-all ${formData.paypal_mode === mode ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-300'}`}>
                                PayPal {mode} Gateway
                             </button>
                           ))}
                        </div>
                        <Input label={<>{formData.paypal_mode?.toUpperCase()} Client ID <Tooltip text="PayPal application client ID." /></>} value={formData[`paypal_${formData.paypal_mode}_client_id`] || ''} onChange={(e) => handleInputChange(`paypal_${formData.paypal_mode}_client_id`, e.target.value)} />
                        <div className="relative">
                          <Input label={<>{formData.paypal_mode?.toUpperCase()} Secret Key <Tooltip text="PayPal application secret key." /></>} value={formData[`paypal_${formData.paypal_mode}_secret`] || ''} onChange={(e) => handleInputChange(`paypal_${formData.paypal_mode}_secret`, e.target.value)} type={showSecrets[`paypal_${formData.paypal_mode}_secret`] ? 'text' : 'password'} />
                          <button type="button" onClick={() => toggleSecret(`paypal_${formData.paypal_mode}_secret`)} className="absolute right-3 top-[34px] text-slate-300">
                             {showSecrets[`paypal_${formData.paypal_mode}_secret`] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'auction' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border border-slate-100">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100"><Gavel size={16} /></div>
                             <p className="text-sm font-bold text-slate-800">Anti-Snipe Auto Extension</p>
                           </div>
                           <button type="button" onClick={() => handleInputChange('auction_auto_extension', !formData.auction_auto_extension)} className={`w-12 h-6 rounded-full relative transition-all ${formData.auction_auto_extension ? 'bg-blue-600' : 'bg-slate-300'}`}>
                             <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${formData.auction_auto_extension ? 'left-6.5' : 'left-0.5'}`} />
                           </button>
                        </div>
                        {formData.auction_auto_extension && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 animate-in slide-in-from-top-2">
                            <Input label={<>Trigger Seconds <Tooltip text="Seconds before end to trigger extension." /></>} type="number" value={formData.auction_extension_trigger || ''} onChange={(e) => handleInputChange('auction_extension_trigger', e.target.value)} />
                            <Input label={<>Extension Seconds <Tooltip text="How many seconds to add." /></>} type="number" value={formData.auction_extension_duration || ''} onChange={(e) => handleInputChange('auction_extension_duration', e.target.value)} />
                            <Input label={<>Max Extensions <Tooltip text="Max times an auction can be extended." /></>} type="number" value={formData.auction_max_extensions || ''} onChange={(e) => handleInputChange('auction_max_extensions', e.target.value)} />
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 border border-slate-100">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100"><Gavel size={16} /></div>
                             <div>
                               <p className="text-sm font-bold text-slate-800">Allow Buy Now After Bids</p>
                               <p className="text-[10px] text-slate-500 font-medium">When disabled, Buy Now becomes unavailable after first bid.</p>
                             </div>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => handleInputChange('ALLOW_BUY_NOW_AFTER_BIDS', !(formData.ALLOW_BUY_NOW_AFTER_BIDS === true || formData.ALLOW_BUY_NOW_AFTER_BIDS === 'true'))} 
                             className={`w-12 h-6 rounded-full relative transition-all ${
                               (formData.ALLOW_BUY_NOW_AFTER_BIDS === true || formData.ALLOW_BUY_NOW_AFTER_BIDS === 'true') ? 'bg-blue-600' : 'bg-slate-300'
                             }`}
                           >
                             <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                               (formData.ALLOW_BUY_NOW_AFTER_BIDS === true || formData.ALLOW_BUY_NOW_AFTER_BIDS === 'true') ? 'left-6.5' : 'left-0.5'
                             }`} />
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
               </Card>
            </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
