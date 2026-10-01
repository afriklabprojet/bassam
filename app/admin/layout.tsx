import type { Metadata } from 'next';
import '../globals.css';
import AdminShell from './AdminShell';
import { getSiteSettings } from '@/lib/site-settings';

export async function generateMetadata(): Promise<Metadata> {
  const { site_name: siteName } = await getSiteSettings();

  return {
    title: `Admin — ${siteName}`,
    description: 'Tableau de bord administrateur',
    robots: 'noindex, nofollow',
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { site_name: siteName } = await getSiteSettings();

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--noir)',
        color: '#E5E5E5',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <AdminShell siteName={siteName}>{children}</AdminShell>
    </div>
  );
}
