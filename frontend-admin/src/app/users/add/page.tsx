'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usersService, rolesService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { 
  User, Mail, Shield, Lock, 
  ChevronRight, Info, AlertCircle,
  ArrowLeft, Check, UserPlus, Loader2, X
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Input from '@/components/common/Input';
import { useDebounce } from 'use-debounce';

export default function AddUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    roleId: '',
    password: '',
  });

  const [debouncedEmail] = useDebounce(formData.email, 500);
  const [debouncedUsername] = useDebounce(formData.username, 500);

  // Availability Checks
  const { data: emailStatus, isFetching: emailChecking } = useQuery({
    queryKey: ['check-email', debouncedEmail],
    queryFn: () => usersService.get(`check-availability`, { type: 'email', value: debouncedEmail }),
    enabled: debouncedEmail.length > 5 && debouncedEmail.includes('@'),
  });

  const { data: usernameStatus, isFetching: usernameChecking } = useQuery({
    queryKey: ['check-username', debouncedUsername],
    queryFn: () => usersService.get(`check-availability`, { type: 'username', value: debouncedUsername }),
    enabled: debouncedUsername.length >= 3,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => rolesService.findAll()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User onboarded successfully');
      router.push('/users');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleId) return toast.error('Please select a user role');
    if (emailStatus?.available === false) return toast.error('Email is already taken');
    if (usernameStatus?.available === false) return toast.error('Username is already taken');
    
    createMutation.mutate(formData);
  };

  const handleGeneratePassword = () => {
    const pass = Math.random().toString(36).slice(-12);
    setFormData({ ...formData, password: pass });
    toast.success('Secure password generated');
  };

  const ValidationIndicator = ({ checking, available, value }: { checking: boolean, available: boolean | undefined, value: string }) => {
    if (!value || (value.length < 3)) return null;
    if (checking) return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    if (available === true) return <Check className="w-3.5 h-3.5 text-green-500" />;
    if (available === false) return <X className="w-3.5 h-3.5 text-red-500" />;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => router.back()} 
             className="p-2 bg-white border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors"
           >
             <ArrowLeft size={16} />
           </button>
           <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Create User Account</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Provision new administrative or customer credentials.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card title="User Identification">
                 <form id="add-user-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <Input 
                         label="First Name" 
                         required 
                         value={formData.firstName} 
                         onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                         placeholder="e.g. John"
                       />
                       <Input 
                         label="Last Name" 
                         required 
                         value={formData.lastName} 
                         onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                         placeholder="e.g. Doe"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <div className="flex justify-between items-center">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                             <ValidationIndicator checking={emailChecking} available={emailStatus?.available} value={formData.email} />
                          </div>
                          <input 
                            className={`admin-input ${emailStatus?.available === false ? 'border-red-300 bg-red-50' : emailStatus?.available === true ? 'border-green-300 bg-green-50' : ''}`}
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="john@example.com"
                          />
                          {emailStatus?.available === false && <p className="text-[9px] font-bold text-red-500 uppercase mt-1">This email is already in use.</p>}
                       </div>

                       <div className="space-y-1">
                          <div className="flex justify-between items-center">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Username</label>
                             <ValidationIndicator checking={usernameChecking} available={usernameStatus?.available} value={formData.username} />
                          </div>
                          <input 
                            className={`admin-input ${usernameStatus?.available === false ? 'border-red-300 bg-red-50' : usernameStatus?.available === true ? 'border-green-300 bg-green-50' : ''}`}
                            required 
                            value={formData.username} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            placeholder="johndoe123"
                          />
                          {usernameStatus?.available === false && <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Username is already taken.</p>}
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</label>
                       <select 
                         className="admin-input"
                         required
                         value={formData.roleId}
                         onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                       >
                         <option value="">Select a role...</option>
                         {rolesData?.items?.map((role: any) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                         ))}
                       </select>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                       <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Password</label>
                          <button 
                            type="button" 
                            onClick={handleGeneratePassword}
                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                          >
                             Generate for me
                          </button>
                       </div>
                       <Input 
                         type="text"
                         value={formData.password}
                         onChange={(e) => setFormData({...formData, password: e.target.value})}
                         placeholder="Leave blank for auto-generation"
                       />
                    </div>
                 </form>
              </Card>
           </div>

           <div className="space-y-6">
              <Card title="Onboarding Summary">
                 <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm">
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-2 flex items-center gap-2">
                          <Info size={12} /> Security Protocol
                       </p>
                       <p className="text-xs text-blue-700 leading-relaxed font-medium">
                          New accounts are initialized as "ACTIVE" by default. Email uniqueness is verified in real-time.
                       </p>
                    </div>

                    <div className="space-y-3">
                       <Button 
                         type="submit" 
                         form="add-user-form"
                         variant="primary" 
                         className="w-full py-4 text-xs font-black uppercase tracking-widest"
                         isLoading={createMutation.isPending}
                         disabled={emailStatus?.available === false || usernameStatus?.available === false}
                       >
                          <UserPlus size={16} className="mr-2" /> Provision Account
                       </Button>
                       <Button 
                         variant="default" 
                         className="w-full py-4 text-xs font-black uppercase tracking-widest"
                         onClick={() => router.push('/users')}
                       >
                          Cancel
                       </Button>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
