'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipFee, setMembershipFee] = useState<number>(5);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { settingsService } = await import('@/services/settings.service');
        const settings = await settingsService.getPublic();
        if (settings && settings.membership_fee) {
          setMembershipFee(Number(settings.membership_fee));
        }
      } catch (err) {
        console.error('Failed to load membership fee setting:', err);
      }
    };
    fetchSettings();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptSubscription: false,
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Validation State
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    general: '',
  });

  const [available, setAvailable] = useState({
    email: false,
    username: false,
    phone: false,
  });

  const [checking, setChecking] = useState({
    email: false,
    username: false,
    phone: false,
  });

  const debouncedEmail = useDebounce(formData.email, 500);
  const debouncedUsername = useDebounce(formData.username, 500);
  const debouncedPhone = useDebounce(formData.phone, 500);

  const checkAvailability = async (field: 'email' | 'username' | 'phone', value: string) => {
    if (!value) {
      setAvailable(prev => ({ ...prev, [field]: false }));
      return;
    }
    
    setChecking(prev => ({ ...prev, [field]: true }));
    setAvailable(prev => ({ ...prev, [field]: false }));

    try {
      const response = await apiClient.post('/auth/check-availability', { field, value });
      const data = response.data;
      if (!data.available) {
        setErrors(prev => ({ ...prev, [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken` }));
        setAvailable(prev => ({ ...prev, [field]: false }));
      } else {
        setErrors(prev => ({ ...prev, [field]: '' }));
        setAvailable(prev => ({ ...prev, [field]: true }));
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setChecking(prev => ({ ...prev, [field]: false }));
    }
  };

  useEffect(() => {
    if (debouncedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail)) {
      checkAvailability('email', debouncedEmail);
    } else {
      setAvailable(prev => ({ ...prev, email: false }));
    }
  }, [debouncedEmail]);

  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkAvailability('username', debouncedUsername);
    } else {
      setAvailable(prev => ({ ...prev, username: false }));
    }
  }, [debouncedUsername]);

  useEffect(() => {
    if (debouncedPhone && debouncedPhone.length >= 10) {
      checkAvailability('phone', debouncedPhone);
    } else {
      setAvailable(prev => ({ ...prev, phone: false }));
    }
  }, [debouncedPhone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Simple local validations
    if (name === 'password' && value.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
    } else if (name === 'password') {
      setErrors(prev => ({ ...prev, password: '' }));
    }

    if (name === 'confirmPassword' && value !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (name === 'confirmPassword') {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.username.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.password.length >= 8 &&
      formData.confirmPassword === formData.password &&
      formData.acceptSubscription === true &&
      available.email &&
      available.username &&
      available.phone &&
      !Object.values(errors).some(x => x !== '' && x !== errors.general) &&
      !Object.values(checking).some(x => x)
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      let avatarUrl = '';

      // 1. Handle Image Upload if present
      if (profileImage) {
        // Show progress swal
        Swal.fire({
          title: 'Uploading Profile...',
          html: 'Please wait while we secure your data.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            popup: 'rounded-[25px] font-poppins',
          }
        });

        // Get presigned URL
        const { data: presignedData } = await apiClient.post('/upload/presigned-url', {
          fileName: profileImage.name,
          fileType: profileImage.type,
          folder: 'profiles'
        });

        // Upload to S3
        try {
          await fetch(presignedData.uploadUrl, {
            method: 'PUT',
            body: profileImage,
            headers: { 'Content-Type': profileImage.type }
          });
          avatarUrl = presignedData.fileUrl;
        } catch (uploadError) {
          console.warn('S3 Upload blocked by CORS or network error. Proceeding without avatar.');
        }
      }

      // 2. Submit Registration
      const { firstName, lastName, email, username, phone, password } = formData;
      const registrationData = {
        firstName,
        lastName,
        email,
        username,
        phone,
        password,
        avatar: avatarUrl,
        role: 'buyer'
      };

      await apiClient.post('/auth/register', registrationData);
      
      Swal.fire({
        icon: 'success',
        title: '<span class="font-poppins font-bold uppercase">Success!</span>',
        text: 'Account created successfully. Please check your email for the activation link.',
        confirmButtonColor: '#C90000',
        customClass: {
          popup: 'rounded-[25px] font-poppins',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-wider'
        }
      }).then(() => {
        router.push('/auth/login?registered=true');
      });

    } catch (error: any) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      
      Swal.fire({
        icon: 'error',
        title: '<span class="font-poppins font-bold uppercase">Registration Error</span>',
        text: message,
        confirmButtonColor: '#111',
        customClass: {
          popup: 'rounded-[25px] font-poppins',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-wider'
        }
      });
      
      setErrors(prev => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationIcon = ({ isChecking, isAvailable, hasError }: { isChecking: boolean, isAvailable: boolean, hasError: boolean }) => {
    if (isChecking) return <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>;
    if (isAvailable) return <i className="fas fa-check-circle absolute right-5 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>;
    if (hasError) return <i className="fas fa-times-circle absolute right-5 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>;
    return null;
  };

  return (
    <main className="bg-[#F8FAFC] py-20 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center animate-fade-in font-poppins">
      <div className="container flex flex-col items-center px-4">
        {/* Toggle Header */}
        <div className="flex items-center bg-white border border-[#E2E8F0] rounded-full p-1.5 mb-12 shadow-sm">
            <Link href="/auth/register" className="px-10 lg:px-14 py-3 rounded-full font-black bg-[#111] text-white shadow-xl text-[0.85rem] uppercase tracking-wider transition-all">Register</Link>
            <Link href="/auth/login" className="px-10 lg:px-14 py-3 rounded-full font-black text-[#64748B] hover:bg-[#F8FAFC] text-[0.85rem] uppercase tracking-wider transition-all">Login</Link>
        </div>

        {/* Register Card */}
        <div className="w-full max-w-[850px] bg-white rounded-[35px] p-10 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            <h2 className="text-[2.5rem] font-black text-[#111] text-center mb-12 tracking-tighter uppercase">Register Your Account</h2>

            <form onSubmit={handleRegister} className="flex flex-col gap-8">
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3">
                        <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">First Name <span className="text-primary">*</span></label>
                        <input 
                            type="text" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John" 
                            className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-5 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.95rem]" 
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Last Name <span className="text-primary">*</span></label>
                        <input 
                            type="text" 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe" 
                            className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl p-5 outline-none focus:bg-white focus:border-primary/20 transition-all font-bold text-[#111] text-[0.95rem]" 
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 relative">
                    <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Email Address <span className="text-primary">*</span></label>
                    <div className="relative">
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com" 
                            className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-14 ${errors.email ? 'border-red-500 bg-red-50' : available.email ? 'border-green-500/30 bg-green-50/20' : 'border-transparent focus:border-primary/20'}`} 
                        />
                        <ValidationIcon isChecking={checking.email} isAvailable={available.email} hasError={!!errors.email} />
                    </div>
                    {errors.email && <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">{errors.email}</span>}
                </div>

                {/* Username / Phone Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3 relative">
                        <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">User Name <span className="text-primary">*</span></label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="johndoe" 
                                className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-14 ${errors.username ? 'border-red-500 bg-red-50' : available.username ? 'border-green-500/30 bg-green-50/20' : 'border-transparent focus:border-primary/20'}`} 
                            />
                            <ValidationIcon isChecking={checking.username} isAvailable={available.username} hasError={!!errors.username} />
                        </div>
                        {errors.username && <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">{errors.username}</span>}
                    </div>
                    <div className="flex flex-col gap-3 relative">
                        <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Phone No. <span className="text-primary">*</span></label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (000) 000-0000" 
                                className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-14 ${errors.phone ? 'border-red-500 bg-red-50' : available.phone ? 'border-green-500/30 bg-green-50/20' : 'border-transparent focus:border-primary/20'}`} 
                            />
                            <ValidationIcon isChecking={checking.phone} isAvailable={available.phone} hasError={!!errors.phone} />
                        </div>
                        {errors.phone && <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">{errors.phone}</span>}
                    </div>
                </div>

                {/* Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3 relative">
                        <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Password <span className="text-primary">*</span></label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create password" 
                                className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-16 ${errors.password ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-primary/20'}`} 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-primary transition-colors">
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                            </button>
                        </div>
                        {errors.password && <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">{errors.password}</span>}
                    </div>
                    <div className="flex flex-col gap-3 relative">
                        <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Confirm Password <span className="text-primary">*</span></label>
                        <div className="relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat password" 
                                className={`w-full bg-[#F8FAFC] border-2 rounded-xl p-5 outline-none focus:bg-white transition-all font-bold text-[#111] text-[0.95rem] pr-16 ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-primary/20'}`} 
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-primary transition-colors">
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                            </button>
                        </div>
                        {errors.confirmPassword && <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-wider px-2">{errors.confirmPassword}</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-[0.7rem] font-black text-[#111] uppercase tracking-[2px]">Profile Picture</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/30 group cursor-pointer overflow-hidden relative min-h-[160px]"
                    >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <>
                            <i className="fas fa-cloud-upload-alt text-3xl text-[#94A3B8] group-hover:text-primary transition-colors"></i>
                            <span className="text-[0.85rem] font-bold text-[#64748B]">Click to upload profile picture</span>
                          </>
                        )}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden" 
                        />
                    </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <input 
                        type="checkbox" 
                        id="acceptSubscription" 
                        name="acceptSubscription"
                        checked={formData.acceptSubscription}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer mt-0.5" 
                    />
                    <label htmlFor="acceptSubscription" className="text-[#111] font-bold text-[0.85rem] cursor-pointer leading-relaxed">
                        I accept the <span className="text-primary font-black">${membershipFee} (One-time Subscription Fee)</span> to unlock bidding and instant buy features on all products.
                    </label>
                </div>

                {errors.general && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-[0.85rem] text-center">{errors.general}</div>}

                <button 
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="bg-primary text-white w-full py-5 rounded-xl text-lg font-black shadow-[0_10px_30px_rgba(201,0,0,0.2)] hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none disabled:grayscale"
                >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : 'Create Account'}
                </button>
            </form>
        </div>
      </div>
    </main>
  );
}
