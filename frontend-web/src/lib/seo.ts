import { Metadata } from 'next';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function generateSeoMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
}: SeoProps): Metadata {
  const baseTitle = 'Mototrad | Premium Auctions';
  const fullTitle = title ? `${title} | Mototrad` : baseTitle;
  const baseDescription = 'Bid on exclusive vehicles and high-end assets in real-time.';
  
  return {
    title: fullTitle,
    description: description || baseDescription,
    keywords: keywords || ['auction', 'mototrad', 'luxury'],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: description || baseDescription,
      url: url,
      siteName: 'Mototrad',
      images: [
        {
          url: image || '/og-image.jpg',
          width: 1200,
          height: 630,
        },
      ],
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description || baseDescription,
      images: [image || '/og-image.jpg'],
    },
  };
}
