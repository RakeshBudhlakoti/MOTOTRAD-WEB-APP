'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';

interface SettingsContextType {
  settings: Record<string, any>;
  isLoading: boolean;
  getSetting: (key: string, defaultValue?: any) => any;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getPublic,
    staleTime: 5 * 60 * 1000, // 5 minutes cache on client side
  });

  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, getSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
