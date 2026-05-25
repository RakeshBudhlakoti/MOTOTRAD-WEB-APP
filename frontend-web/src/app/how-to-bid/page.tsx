'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

export default function HowToBidPage() {
  const { getSetting } = useSettings();
  const supportPhone = String(getSetting('support_phone') || '(760) 401-4871');
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

  return (
    <main className="flex-1 w-full bg-[#F8FAFC] py-8 lg:py-16 animate-fade-in">
      {/* SEO Title & Meta Tags */}
      <title>How to Bid | Mototrad Auctions</title>
      <meta name="description" content="Learn how to bid and buy vehicles, motorcycles, and fine items at Mototrad Auctions. View registration, pickup, and buyer fee guidelines." />

      <div className="container max-w-5xl mx-auto px-4">
        {/* Page Header Banner */}
        <div className="mb-10 lg:mb-16 text-center">
          <span className="text-primary text-[10px] font-black uppercase tracking-[3px] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 inline-block mb-3.5">
            Welcome to the Mototrad Auctions!
          </span>
          <h1 className="text-[2.2rem] lg:text-[3.2rem] font-black text-[#0F172A] tracking-tight leading-tight">
            How To Bid & <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Buy</span>
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-600 mx-auto rounded-full mt-4 mb-4" />
        </div>

        {/* Simple & Clean Informational Card */}
        <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#F1F5F9] w-full flex flex-col gap-6">
          <div>
            <h4 className="text-[0.8rem] font-extrabold text-[#64748B] uppercase tracking-wider mb-3">To get started:</h4>
            <ol className="list-decimal pl-5 text-sm text-[#111] font-bold flex flex-col gap-2">
              <li>Register to Bid</li>
              <li>Pay ${membershipFee} one-time fee</li>
              <li>Win any item</li>
            </ol>
          </div>

          <p className="text-sm text-[#64748B] font-semibold leading-relaxed">
            All bidders must be registered prior to bidding with a valid payment option on file.
          </p>

          <p className="text-sm text-[#64748B] font-semibold leading-relaxed">
            All items will be assessed a minimum buyer fee of 10% at the conclusion of their individual sale. Therefore, if a bidder wins 3 items at $100 each, at the end of the auction, he/she will have a $30 buyer fee. These fees are non-refundable and required to keep the platform operational.
          </p>

          <p className="text-sm text-[#64748B] font-semibold leading-relaxed">
            Only buyer fees are collected through the payment option on file.
          </p>

          <p className="text-sm text-primary font-black leading-relaxed italic border-l-4 border-primary pl-4 bg-primary/5 py-3 rounded-r-xl">
            The remaining balance must be paid in cash at the time of pickup. All sales are final — no refunds and no returns.
          </p>

          <p className="text-sm text-[#64748B] font-semibold leading-relaxed">
            Items must be picked up within <span className="font-black text-[#111]">78 hours</span> of the conclusion of the sale. If you fail to pick up your item within one week, we will re-auction your item and you will also be responsible for the <span className="font-black text-[#111]">10% buyer fee</span>.
          </p>

          <p className="text-sm text-[#64748B] font-semibold leading-relaxed">
            Pickup is by appointment only. Each item has an address, phone number, or an email. If the seller is not reasonable with pickup accommodations, please contact our team via text or email so we can assist.
          </p>

          <div className="flex flex-col gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
            <span className="text-[0.65rem] font-black text-[#64748B] uppercase tracking-wider block">Contact Information</span>
            <div className="flex items-center gap-2 font-bold text-sm text-[#111]">
              <i className="fas fa-phone-alt text-primary text-xs"></i> Phone: <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="text-primary hover:underline">{supportPhone}</a>
            </div>
            <p className="text-xs text-[#64748B] font-semibold">
              Please notify the seller/location before pickup.
            </p>
          </div>

          <p className="text-sm text-[#64748B] font-semibold leading-relaxed">
            ID is required at pickup along with confirmation that you have paid your buyer fees (email confirmation or screenshot accepted).
          </p>

          <div className="pt-4 border-t border-[#F1F5F9] flex justify-center sm:justify-start">
            <Link
              href="/auth/register"
              className="bg-primary text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#B20000] hover:-translate-y-0.5 active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
            >
              Let's Get Started! <i className="fas fa-arrow-right text-[0.7rem]"></i>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
