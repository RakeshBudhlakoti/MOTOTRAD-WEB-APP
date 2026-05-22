'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { contactService } from '@/services/contact.service';
import { useSettings } from '@/context/SettingsContext';

type ContactFormData = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export default function ContactUsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const { getSetting } = useSettings();
  const supportPhone = String(getSetting('support_phone') || '');
  const supportEmail = String(getSetting('support_email') || '');
  const siteAddress = String(getSetting('site_address') || '');

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await contactService.submitInquiry(data);
      toast.success('Your message has been sent successfully! Our team will get back to you shortly.');
      setIsSubmitted(true);
      reset();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 w-full bg-[#F8FAFC] py-8 lg:py-16 animate-fade-in">
      {/* SEO Title & Meta Tags */}
      <title>Contact Us | Mototrad Marketplace</title>
      <meta name="description" content="Get in touch with Mototrad. Contact our high-end luxury vehicle, timepiece, and fine art concierge team for any questions or support." />

      <div className="container">
        {/* Page Header Banner */}
        <div className="mb-8 lg:mb-12 text-center">
          <span className="text-primary text-[0.7rem] font-black uppercase tracking-[4px] mb-2 block">Support Concierge</span>
          <h1 className="text-[2rem] lg:text-[2.8rem] font-black text-[#111] uppercase tracking-tighter mb-3 leading-tight">
            Contact Our Specialists
          </h1>
          <div className="h-1.5 w-24 bg-primary rounded-full shadow-[0_2px_10px_rgba(211,47,47,0.3)] mx-auto"></div>
          <p className="mt-4 text-[#64748B] font-medium max-w-[650px] leading-relaxed mx-auto">
            Have questions about bidding, selling, or platform membership? Reach out and a Mototrad concierge will assist you immediately.
          </p>
        </div>

        {/* Dynamic Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto mt-6">
          
          {/* Left Column: Premium Info Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-[0_4px_40px_rgba(0,0,0,0.02)] border border-[#F1F5F9] flex flex-col gap-6">
              <h3 className="text-lg font-black text-[#111] uppercase tracking-tight border-b border-[#F1F5F9] pb-4">
                Corporate HQ
              </h3>
              
              {/* Address info block */}
              {siteAddress && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#111] text-sm uppercase tracking-wide">Main Address</h5>
                    <p className="text-xs text-[#64748B] font-medium mt-1 leading-relaxed whitespace-pre-line">
                      {siteAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* VIP Concierge Phone info block */}
              {supportPhone && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <i className="fas fa-phone-alt"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#111] text-sm uppercase tracking-wide">Concierge Line</h5>
                    <p className="text-xs text-[#64748B] font-medium mt-1">
                      <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="text-[#64748B] hover:text-primary transition-colors">{supportPhone}</a>
                    </p>
                    <span className="text-[10px] text-green-600 font-extrabold uppercase mt-1 block">Mon-Sat, 9AM - 8PM EST</span>
                  </div>
                </div>
              )}

              {/* Email support block */}
              {supportEmail && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#111] text-sm uppercase tracking-wide">Digital Support</h5>
                    <p className="text-xs text-primary font-bold mt-1">
                      <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Guarantee card */}
            <div className="bg-[#111] rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl grow flex flex-col justify-end min-h-[220px]">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none">
                <i className="fas fa-shield-alt"></i>
              </div>
              <span className="text-[0.6rem] text-primary font-black uppercase tracking-[3px] mb-2 block">Premium Guarantee</span>
              <h4 className="text-xl font-black uppercase tracking-tight leading-snug">
                Response Within<br />2 Hours Guaranteed
              </h4>
              <p className="text-[0.75rem] text-[#AAA] font-medium mt-3 leading-relaxed">
                All client inquiries receive express handling from our dedicated customer support specialist group.
              </p>
            </div>
          </div>

          {/* Right Column: Sleek Contact Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-[#F1F5F9] h-full flex flex-col justify-center">
              {isSubmitted ? (
                // Success screen inside the card
                <div className="text-center py-12 flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 shadow-sm">
                    <i className="fas fa-check-circle text-4xl"></i>
                  </div>
                  <h3 className="text-2xl font-black text-[#111] uppercase tracking-tight mb-2">Message Received</h3>
                  <p className="text-[#64748B] font-medium text-sm max-w-[380px] leading-relaxed mx-auto">
                    Thank you for contacting us. Your message has been saved and routed to our customer support division. We will email you back shortly.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 bg-[#111] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-primary hover:-translate-y-0.5 transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                // Contact Form
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 lg:gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
                    {/* Name field */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px]">
                        Full Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        {...register('name', { required: 'Name is required' })}
                        className={`bg-[#F8FAFC] border-2 rounded-xl p-3.5 outline-none text-sm font-semibold transition-all ${
                          errors.name ? 'border-primary/50 focus:border-primary' : 'border-transparent focus:bg-white focus:border-primary/20'
                        }`}
                      />
                      {errors.name && <span className="text-xs text-primary font-bold">{errors.name.message}</span>}
                    </div>

                    {/* Phone field */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px]">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        {...register('phone')}
                        className="bg-[#F8FAFC] border-2 border-transparent rounded-xl p-3.5 outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px]">
                      Email Address <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className={`bg-[#F8FAFC] border-2 rounded-xl p-3.5 outline-none text-sm font-semibold transition-all ${
                        errors.email ? 'border-primary/50 focus:border-primary' : 'border-transparent focus:bg-white focus:border-primary/20'
                      }`}
                    />
                    {errors.email && <span className="text-xs text-primary font-bold">{errors.email.message}</span>}
                  </div>

                  {/* Subject field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px]">
                      Subject <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Question about Bidding Process"
                      {...register('subject', { required: 'Subject is required' })}
                      className={`bg-[#F8FAFC] border-2 rounded-xl p-3.5 outline-none text-sm font-semibold transition-all ${
                        errors.subject ? 'border-primary/50 focus:border-primary' : 'border-transparent focus:bg-white focus:border-primary/20'
                      }`}
                    />
                    {errors.subject && <span className="text-xs text-primary font-bold">{errors.subject.message}</span>}
                  </div>

                  {/* Message field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px]">
                      Your Message <span className="text-primary">*</span>
                    </label>
                    <textarea
                      placeholder="How can we assist you today? Please provide as much detail as possible..."
                      rows={4}
                      {...register('message', {
                        required: 'Message is required',
                        minLength: { value: 10, message: 'Message must be at least 10 characters long' },
                      })}
                      className={`bg-[#F8FAFC] border-2 rounded-xl p-3.5 outline-none text-sm font-semibold resize-none transition-all ${
                        errors.message ? 'border-primary/50 focus:border-primary' : 'border-transparent focus:bg-white focus:border-primary/20'
                      }`}
                    ></textarea>
                    {errors.message && <span className="text-xs text-primary font-bold">{errors.message.message}</span>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-white w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg hover:bg-[#B20000] hover:-translate-y-1 transition-all active:scale-95 disabled:bg-slate-400 disabled:-translate-y-0 disabled:scale-100 flex items-center justify-center gap-3 mt-4 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        <span>Send Support Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
