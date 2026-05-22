'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

export default function Footer() {
  const { getSetting } = useSettings();
  const phone = getSetting('support_phone', '(760) 401 4871');
  const email = getSetting('support_email', 'partsthief1@gmail.com');

  return (
    <footer className="bg-[#111] text-white py-8 border-t border-[#222]">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Quick Links */}
          <div className="flex gap-6 items-center">
            <Link href="/terms" className="text-[#888] no-underline text-[0.75rem] font-bold uppercase tracking-wider hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[#888] no-underline text-[0.75rem] font-bold uppercase tracking-wider hover:text-white transition-colors">Privacy</Link>
            <Link href="/contact" className="text-[#888] no-underline text-[0.75rem] font-bold uppercase tracking-wider hover:text-white transition-colors">Support</Link>
          </div>

          {/* Copyright */}
          <p className="text-[#555] text-[0.75rem] font-bold uppercase tracking-wider order-3 md:order-2">
            &copy; {new Date().getFullYear()} Mototrad. All rights reserved.
          </p>

          {/* Contact Info */}
          <div className="flex gap-6 items-center order-2 md:order-3">
              <p className="flex items-center gap-2 text-[0.75rem] text-[#888] font-bold uppercase tracking-wider">
                  <i className="fas fa-phone text-primary"></i> {phone}
              </p>
              <p className="flex items-center gap-2 text-[0.75rem] text-[#888] font-bold uppercase tracking-wider">
                  <i className="fas fa-envelope text-primary"></i> {email}
              </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
