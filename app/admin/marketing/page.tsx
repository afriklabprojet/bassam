'use client';

import { useState } from 'react';
import { GOLD } from '@/lib/admin-theme';
import { PromoCodesTab } from './PromoCodesTab';
import { NewsletterTab } from './NewsletterTab';
import { BannersTab } from './BannersTab';

type Tab = 'promo' | 'newsletter' | 'banners';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'promo', label: 'Codes promo', icon: '🏷️' },
  { id: 'newsletter', label: 'Newsletter', icon: '📧' },
  { id: 'banners', label: 'Bannières', icon: '🖼️' },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('promo');

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>Marketing</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Codes promo, abonnés newsletter et bannières promotionnelles</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'rgba(197,165,90,0.15)' : 'transparent',
              border: activeTab === tab.id ? '1px solid rgba(197,165,90,0.3)' : '1px solid transparent',
              color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.5)',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
        {activeTab === 'promo' && <PromoCodesTab />}
        {activeTab === 'newsletter' && <NewsletterTab />}
        {activeTab === 'banners' && <BannersTab />}
      </div>
    </div>
  );
}
