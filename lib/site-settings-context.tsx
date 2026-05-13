'use client';

/**
 * React context for site settings.
 * The server populates initial values in app/layout.tsx,
 * client components consume via `useSiteSettings()`.
 */

import React, { createContext, useContext } from 'react';
import type { SiteSettings } from './site-settings';
import { DEFAULT_SETTINGS } from './site-settings';

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

interface SiteSettingsProviderProps {
  readonly children: React.ReactNode;
  readonly value: SiteSettings;
}

export function SiteSettingsProvider({
  children,
  value,
}: SiteSettingsProviderProps) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
