'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem('pwa-dismissed') === 'true';

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
      });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install button only if the user has not dismissed it before
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to not show again for this session
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 shadow-2xl" style={{ background: 'var(--noir)', borderTop: '1px solid var(--gold)' }}>
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 14, fontWeight: 300, letterSpacing: 1 }}>VB</span>
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--offwhite)', letterSpacing: '0.06em' }}>Installer l&apos;application</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-pale)' }}>
              Accédez rapidement depuis votre écran d&apos;accueil
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="btn-gold text-xs px-4 py-2"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs px-4 py-2 transition-colors"
            style={{ color: 'var(--text-pale)' }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
