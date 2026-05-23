import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

async function getSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/settings/public`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch public settings in layout:', err);
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const favicon = settings?.site_favicon || 'https://mototrad.com/assets/images/favicon.png';
  const title = settings?.site_title || 'Mototrad | Buy Ride or Revive';
  const description = settings?.site_tagline || 'Premium online auction platform for vintage cars, luxury watches, gemstones, and motorcycles.';

  return {
    title,
    description,
    keywords: ['auction', 'marketplace', 'real-time bidding', 'vehicles', 'collectibles', 'mototrad'],
    icons: {
      icon: favicon,
    },
    other: {
      'viewport': 'width=device-width, initial-scale=1',
    }
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const favicon = settings?.site_favicon || 'https://mototrad.com/assets/images/favicon.png';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={favicon} />
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
