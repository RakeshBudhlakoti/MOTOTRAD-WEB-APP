import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Mototrad | Buy Ride or Revive',
  description: 'Premium online auction platform for vintage cars, luxury watches, gemstones, and motorcycles.',
  keywords: ['auction', 'marketplace', 'real-time bidding', 'vehicles', 'collectibles', 'mototrad'],
  icons: {
    icon: 'https://mototrad.com/assets/images/favicon.png',
  },
  other: {
    'viewport': 'width=device-width, initial-scale=1',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,slnt,wdth,wght,ROND@8..144,-10..0,25..150,100..900,0..100&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Symbols:opsz,wght,FILL,GRAD,ROND@40..48,300,0..1,0,50&display=block" rel="stylesheet" />
      </head>
      <body className="font-poppins">
        <Providers>
          <div className="site-wrapper">
            <Navbar />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
