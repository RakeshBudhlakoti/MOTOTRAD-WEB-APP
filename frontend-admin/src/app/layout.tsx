import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import DynamicFavicon from '@/components/DynamicFavicon';

export const metadata: Metadata = {
  title: 'Mototrad Admin Panel',
  description: 'Scalable production-ready admin panel for Mototrad',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <DynamicFavicon />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,slnt,wdth,wght,ROND@8..144,-10..0,25..150,100..900,0..100&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Symbols:opsz,wght,FILL,GRAD,ROND@40..48,300,0..1,0,50&display=block" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

