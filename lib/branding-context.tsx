'use client';

import React, { createContext, useContext } from 'react';
import type { BrandingConfig } from './branding';
import { DEFAULT_BRANDING } from './branding';

const BrandingContext = createContext<BrandingConfig>(DEFAULT_BRANDING);

/**
 * Fournit la config branding aux composants client (admin panel principalement).
 * La valeur est hydratée côté serveur dans layout.tsx.
 */
export function BrandingProvider({
  children,
  value,
}: Readonly<{ children: React.ReactNode; value: BrandingConfig }>) {
  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

/** Hook pour lire la config branding courante dans un composant client. */
export function useBranding(): BrandingConfig {
  return useContext(BrandingContext);
}
