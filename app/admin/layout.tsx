import type { Metadata } from 'next';
import '../globals.css';
import AdminShell from './AdminShell';

export const metadata: Metadata = {
  title: 'Admin — VIP Parfumerie Bar',
  description: 'Tableau de bord administrateur',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--noir)',
        color: '#E5E5E5',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
