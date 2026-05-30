'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const links = [
    { href: '/', label: t('Nav.home') },
    { href: '/universities', label: t('Nav.universities') },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-700">
          {t('Brand.name')}
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active =
              l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher />
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {t('Nav.signOut')}
            </button>
          ) : (
            <Link
              href="/auth"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t('Nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
