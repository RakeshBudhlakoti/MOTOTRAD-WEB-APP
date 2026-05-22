'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usersService, rolesService, uploadService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { 
  User, Shield, 
  ArrowLeft, Save, Camera, Loader2, Copy
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Input from '@/components/common/Input';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    roleId: '',
    phone: '',
    avatar: '',
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);

  // Password strength visualizer
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', textClass: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1; // Weak
    if (pass.length >= 8) score += 1; // Normal
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass)) score += 1; // Strong
    if (/[^A-Za-z0-9]/.test(pass) && pass.length >= 10) score += 1; // Super Strong

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500', textClass: 'text-red-500' };
      case 2:
        return { score: 50, label: 'Normal', color: 'bg-amber-500', textClass: 'text-amber-500' };
      case 3:
        return { score: 75, label: 'Strong', color: 'bg-blue-500', textClass: 'text-blue-500' };
      case 4:
        return { score: 100, label: 'Super Strong', color: 'bg-emerald-500', textClass: 'text-emerald-500' };
      default:
        return { score: 10, label: 'Very Weak', color: 'bg-red-600', textClass: 'text-red-600' };
    }
  };

  // Secure Password Generator
  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const all = uppercase + lowercase + numbers + symbols;
    
    let generated = '';
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = 0; i < 8; i++) {
      generated += all[Math.floor(Math.random() * all.length)];
    }
    
    generated = generated.split('').sort(() => 0.5 - Math.random()).join('');
    
    setPassword(generated);
    setConfirmPassword(generated);
    toast.success('Strong password generated!');
  };

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => usersService.findOne(userId),
    enabled: !!userId
  });

  // Fetch available roles
  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => rolesService.findAll()
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        username: userData.username || '',
        roleId: userData.roleId || '',
        phone: userData.phone || '',
        avatar: userData.avatar || '',
      });
    }
  }, [userData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersService.update(userId, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('Account updated successfully');

      // Sync Redux/Cookies/LocalStorage if updating the currently logged-in user!
      if (currentUser?.id === userId) {
        const updatedUser = { ...currentUser, ...data };
        dispatch(setCredentials({
          user: updatedUser,
          token: localStorage.getItem('adminToken') || '',
        }));
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
        document.cookie = `user=${JSON.stringify(updatedUser)}; path=/; max-age=86400; SameSite=Lax`;
      }

      router.push('/users');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update account');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    // Filter out disabled fields to prevent backend issues
    const { email, username, ...updateData } = formData;
    const payload = {
      ...updateData,
      ...(password && { password }),
    };
    updateMutation.mutate(payload);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Image size must be less than 2MB');
    }

    try {
      setUploading(true);
      // 1. Get Presigned URL
      const { uploadUrl, fileUrl } = await uploadService.getPresignedUrl(file.name, file.type, 'avatars');
      
      // 2. Upload to S3
      const uploadRes = await uploadService.uploadToS3(uploadUrl, file);
      
      if (!uploadRes.ok) throw new Error('Failed to upload to S3');

      // 3. Update local state
      setFormData(prev => ({ ...prev, avatar: fileUrl }));
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
           <Loader2 className="w-8 h-8 animate-spin mb-4" />
           <p className="text-xs font-black uppercase tracking-widest">Retrieving identity data...</p>
        </div>
      </DashboardLayout>
    );
  }

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
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Edit Member Profile</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Modify account details and system permissions.</p>
           </div>
        </div>

        <form id="edit-user-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card title="Account Identity">
                 <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
                       <div className="relative group">
                          <div className="w-24 h-24 rounded-sm bg-slate-100 border-2 border-slate-200 overflow-hidden">
                             {formData.avatar ? (
                               <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <User size={40} />
                               </div>
                             )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-sm flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                             {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                          </label>
                       </div>
                       <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Profile Picture</h4>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">JPG, PNG or GIF. Max size 2MB. Stored on S3 (avatars/).</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <Input 
                         label="First Name" 
                         required 
                         value={formData.firstName} 
                         onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                       />
                       <Input 
                         label="Last Name" 
                         required 
                         value={formData.lastName} 
                         onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address (Locked)</label>
                          <input 
                            disabled 
                            className="admin-input bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" 
                            value={formData.email} 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username (Locked)</label>
                          <input 
                            disabled 
                            className="admin-input bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" 
                            value={formData.username} 
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <Input 
                         label="Phone Number" 
                         value={formData.phone} 
                         onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         placeholder="+1 (555) 000-0000"
                       />
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
                    </div>
                 </div>
              </Card>

              <Card title="Change Password (Optional)">
                 <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                       <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                          Leave blank to keep the current password.
                       </p>
                       <button
                          type="button"
                          onClick={generatePassword}
                          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors rounded-sm"
                       >
                          ⚡ Generate Random
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Password</label>
                           <div className="relative">
                              <input
                                 type="text"
                                 className="admin-input pr-10"
                                 placeholder="••••••••"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                              />
                              {password && (
                                 <button
                                    type="button"
                                    onClick={() => {
                                       navigator.clipboard.writeText(password);
                                       toast.success('Password copied to clipboard!');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Copy to Clipboard"
                                 >
                                    <Copy size={14} />
                                 </button>
                              )}
                           </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm New Password</label>
                           <input
                             type="text"
                             className="admin-input"
                             placeholder="••••••••"
                             value={confirmPassword}
                             onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                       </div>
                    </div>

                    {password && (
                       <div className="space-y-2 p-4 bg-slate-50 border border-slate-100 rounded-sm">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-400">Password Strength:</span>
                             <span className={getPasswordStrength(password).textClass}>
                                {getPasswordStrength(password).label}
                             </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                                style={{ width: `${getPasswordStrength(password).score}%` }}
                             />
                          </div>
                       </div>
                    )}
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card title="Update Actions">
                 <div className="space-y-4">
                    <Button 
                      type="submit" 
                      form="edit-user-form"
                      variant="primary" 
                      className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                      isLoading={updateMutation.isPending}
                    >
                       <Save size={16} className="mr-2" /> Save Changes
                    </Button>
                    <Button 
                      variant="default" 
                      className="w-full py-4 text-xs font-black uppercase tracking-widest"
                      onClick={() => router.push('/users')}
                    >
                       Cancel
                    </Button>
                 </div>
              </Card>

              <div className="bg-amber-50 border border-amber-100 p-6 rounded-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">Security Note</span>
                 </div>
                 <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                    Critical identifiers (Email and Username) are locked to maintain audit integrity and prevent identity spoofing.
                 </p>
              </div>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
