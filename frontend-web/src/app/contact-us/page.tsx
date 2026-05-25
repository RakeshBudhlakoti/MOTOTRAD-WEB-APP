'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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

  const faqs = [
    { 
      q: 'How do I register to bid on vehicles?', 
      a: 'To place bids, you must create an account and complete our secure KYC verification. Once verified, you can instantly bid on any live or upcoming auctions.' 
    },
    { 
      q: 'Are there any buyer premiums or hidden fees?', 
      a: 'No, Mototrad operates with 100% transparency. Any applicable buyer premiums or transaction fees are clearly shown on the auction detail page before you bid.' 
    },
    { 
      q: 'How are shipping and transport handled?', 
      a: 'We partner with premium global logistics networks. Our post-sale team will coordinate transport, customs clearance, and secure delivery to your doorstep.' 
    }
  ];

  return (
    <main className="flex-1 w-full bg-slate-50/50 py-10 lg:py-20 relative overflow-hidden">
      {/* Dynamic Background Blurs for high-end aesthetic */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* SEO Title & Meta Tags */}
      <title>Contact Us | Mototrad Marketplace</title>
      <meta name="description" content="Get in touch with Mototrad. Contact our high-end luxury vehicle, timepiece, and fine art concierge team for any questions or support." />

      <div className="container relative z-10">
        {/* Page Header Banner - Styled in Unified Heading style */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-20 text-center"
        >
          <span className="text-primary text-[10px] font-black uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
            Support Concierge
          </span>
          <h1 className="text-[2.2rem] lg:text-[3.2rem] font-black text-[#0F172A] tracking-tight leading-tight">
            Contact Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Specialists</span>
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 mx-auto rounded-full mt-4 mb-4" />
          <p className="mt-4 text-[#475569] text-sm lg:text-base font-medium max-w-[600px] leading-relaxed mx-auto px-4">
            Have questions about bidding, selling, or platform membership? Reach out and a Mototrad concierge will assist you immediately.
          </p>
        </motion.div>

        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto">
          
          {/* Left Column: Interactive Contact Methods & FAQ Accordion */}
          <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col gap-4"
            >
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[2px] mb-2 px-1">
                Quick Connection
              </h3>

              {/* VIP Concierge Phone Card */}
              {supportPhone && (
                <motion.a
                  href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white border border-[#E2E8F0]/70 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(211,47,47,0.06)] hover:border-primary/20 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110">
                    <i className="fas fa-phone-alt"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Hotline Support</h5>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{supportPhone}</p>
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase mt-1 block">Mon-Sat • 9AM - 8PM EST</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </motion.a>
              )}

              {/* Digital Support Email Card */}
              {supportEmail && (
                <motion.a
                  href={`mailto:${supportEmail}`}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white border border-[#E2E8F0]/70 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(46,134,222,0.06)] hover:border-blue-500/20 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/5 text-blue-500 flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Email Concierge</h5>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{supportEmail}</p>
                    <span className="text-[9px] text-blue-500 font-extrabold uppercase mt-1 block">Response in under 2 hours</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-500">
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </motion.a>
              )}

              {/* Office Address Card */}
              {siteAddress && (
                <div className="bg-white border border-[#E2E8F0]/70 p-5 rounded-2xl flex items-start gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg shrink-0">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Headquarters</h5>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed whitespace-pre-line">
                      {siteAddress}
                    </p>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1.5 block">Access by Appointment Only</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Interactive FAQs Accordion Widget */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white border border-[#E2E8F0]/70 p-6 rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.02)] flex flex-col gap-4 mt-4 lg:mt-0"
            >
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[2px] border-b border-slate-50 pb-3 px-1">
                Frequently Answered
              </h4>
              <div className="flex flex-col gap-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-[#F8FAFC] last:border-b-0 pb-3 last:pb-0">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-xs font-extrabold text-slate-800 hover:text-primary transition-colors focus:outline-none"
                    >
                      <span className="flex gap-2">
                        <span className="text-primary/45 font-black">?</span>
                        {faq.q}
                      </span>
                      <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 ${expandedFaq === idx ? 'rotate-180 text-primary' : ''}`}></i>
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedFaq === idx && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[11px] text-slate-600 font-semibold mt-2.5 pl-4 leading-relaxed border-l-2 border-primary/20">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Sleek Contact Form Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-[#E2E8F0]/70 h-full flex flex-col justify-center">
              {isSubmitted ? (
                // Success screen inside the card
                <div className="text-center py-12 flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mb-6 shadow-sm">
                    <i className="fas fa-check-circle text-4xl"></i>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-black text-[#0F172A] uppercase tracking-tight mb-2">Message Saved</h3>
                  <p className="text-[#64748B] font-medium text-sm max-w-[380px] leading-relaxed mx-auto">
                    Thank you for contacting us. Your message has been safely saved and routed to our dedicated division. We will email you back shortly.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 bg-primary text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-100 hover:bg-[#B20000] hover:-translate-y-0.5 transition-all"
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
                      <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px] ml-0.5">
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
                      <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px] ml-0.5">
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
                    <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px] ml-0.5">
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
                    <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px] ml-0.5">
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
                    <label className="text-[0.65rem] font-extrabold text-[#64748B] uppercase tracking-[1.5px] ml-0.5">
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
          </motion.div>
          
        </div>
      </div>
    </main>
  );
}
