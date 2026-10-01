import { getSiteSettings } from '@/lib/site-settings';
import { SiteSettingsProvider } from '@/lib/site-settings-context';

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteSettings = await getSiteSettings();

  return (
    <SiteSettingsProvider value={siteSettings}>
      {children}
    </SiteSettingsProvider>
  );
}
