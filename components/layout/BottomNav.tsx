'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { LimelightNav, type NavItem } from '@/components/ui/LimelightNav';

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
);
const CapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></svg>
);
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>
);

const routes = ['/', '/universities', '/auth'] as const;

export function BottomNav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex =
    pathname === '/'
      ? 0
      : pathname.startsWith('/universities')
        ? 1
        : pathname.startsWith('/auth')
          ? 2
          : 0;

  const items: NavItem[] = [
    { id: 'home', icon: <HomeIcon />, label: t('home'), onClick: () => router.push('/') },
    { id: 'universities', icon: <CapIcon />, label: t('universities'), onClick: () => router.push('/universities') },
    { id: 'account', icon: <UserIcon />, label: t('signIn'), onClick: () => router.push('/auth') },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 sm:hidden">
      <LimelightNav
        items={items}
        defaultActiveIndex={activeIndex}
        className="shadow-theme"
      />
    </div>
  );
}
