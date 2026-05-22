'use client';

import { useEffect } from 'react';
import { ADMIN_CONSTANTS } from '@/constants/app.constants';

export default function DynamicFavicon() {
  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const response = await fetch(`${ADMIN_CONSTANTS.API_URL}/settings/public`);
        if (!response.ok) return;
        const data = await response.json();
        const siteFavicon = data.site_favicon;

        if (siteFavicon) {
          // Find or create the favicon link element
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = siteFavicon;
        }
      } catch (error) {
        console.error('Error fetching dynamic favicon:', error);
      }
    };

    fetchFavicon();
  }, []);

  return null;
}
