'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

export default function PhilosophyPage() {
  const { getSetting } = useSettings();
  const supportPhone = String(getSetting('support_phone') || '(760) 401-4871');
  const supportEmail = String(getSetting('support_email') || 'info@mototrad.com');
  return (
    <main className="flex-1 w-full bg-[#F8FAFC] py-8 lg:py-16 animate-fade-in">
      {/* SEO Title & Meta Tags */}
      <title>Our Philosophy | Mototrad Marketplace</title>
      <meta name="description" content="Discover the core philosophy and values driving Mototrad Auctions. We work with integrity, transparency, and advanced technology to connect buyers and sellers." />

      <div className="container max-w-5xl mx-auto px-4">
        {/* Page Header Banner */}
        <div className="mb-10 lg:mb-16 text-center">
          <span className="text-primary text-[10px] font-black uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
            Our Vision
          </span>
          <h1 className="text-[2.2rem] lg:text-[3.2rem] font-black text-[#0F172A] tracking-tight leading-tight">
            Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Philosophy</span>
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 mx-auto rounded-full mt-4 mb-4" />
          <p className="mt-4 text-[#475569] text-sm lg:text-base font-medium max-w-[650px] leading-relaxed mx-auto px-4">
            At Mototrad, we bridge modern digital connection with raw vehicle marketplace efficiency.
          </p>
        </div>

        {/* Philosophy Main Description Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch mb-12">
          {/* Main Story block */}
          <div className="md:col-span-7 bg-white rounded-[32px] p-6 lg:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#F1F5F9] flex flex-col justify-center">
            <h3 className="text-lg lg:text-xl font-black text-[#111] uppercase tracking-tight border-b border-[#F1F5F9] pb-4 mb-4 flex items-center gap-2.5">
              <i className="fas fa-bullseye text-primary"></i> Connecting the Unconnected
            </h3>
            <p className="text-sm text-[#64748B] font-medium leading-relaxed mb-4">
              We use online technology to help clients clear out their inventory quickly and efficiently. Whether it is an individual, a business, an estate sale, or a tow yard needing to liquidate vehicles fast—we connect the public to vehicles found nowhere else.
            </p>
            <p className="text-sm text-[#64748B] font-medium leading-relaxed">
              If you have any motorcycles or vehicles and you need to get rid of them, please reach out. We can auction them off or even send someone to pick them up now! All we ask is that you send us at least one picture and a description of your items.
            </p>
          </div>

          {/* Seller CTA info Card */}
          <div className="md:col-span-5 bg-white rounded-[32px] p-6 lg:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#F1F5F9] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-[#111] uppercase tracking-tight border-b border-[#F1F5F9] pb-4 mb-4">
                For Sellers
              </h3>
              <p className="text-xs text-[#64748B] font-semibold leading-relaxed">
                If you are a seller wanting to clear out your vehicles then our Auction is for you! We will immediately send an associate to you and make sure we help you liquidate fast.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4.5 mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-sms"></i>
                </div>
                <div className="text-xs font-bold text-[#111]">
                  Text: <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="text-primary hover:underline">{supportPhone}</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="text-xs font-bold text-[#111]">
                  Email: <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Integrity Guarantee Section */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#F1F5F9] w-full">
          <h3 className="text-lg lg:text-xl font-black text-[#111] uppercase tracking-tight mb-4 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span> Promise To Work with Integrity and Transparency
          </h3>
          <p className="text-sm text-[#64748B] font-medium leading-relaxed">
            We work to create a network focused on maintaining the highest "integrity." In the event we make a mistake we guarantee to fix it. We use the highest security measures when collecting payments and securing your data. Rest assured, our auctions are accurate, transparent, and designed to protect our users and community.
          </p>
        </div>
      </div>
    </main>
  );
}
