'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isAdminEmail } from '@/lib/supabase/env';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: t('Nav.home') },
    { href: '/universities', label: t('Nav.universities') },
    { href: '/fields', label: t('Nav.fields') },
    { href: '/scholarships', label: t('Nav.scholarships') },
    { href: '/quiz', label: t('Nav.quiz') },
    { href: '/calendar', label: t('Nav.calendar') },
    { href: '/blog', label: t('Nav.blog') },
    ...(user ? [{ href: '/saved', label: t('Nav.saved') }] : []),
    { href: '/contact', label: t('Nav.contact') },
    ...(isAdminEmail(user?.email) ? [{ href: '/admin', label: t('Nav.admin') }] : []),
  ];

  // Close the dropdown whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-unireal.png"
            alt={t('Brand.name')}
            className="h-9 w-9 rounded-md object-contain dark:bg-white dark:p-0.5"
          />
          <span className="text-lg font-bold text-primary">{t('Brand.name')}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active =
              l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/auth"
                className={`hidden rounded-md px-3 py-1.5 text-sm font-medium lg:inline-block ${
                  pathname.startsWith('/auth')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {t('Nav.account')}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:inline-block"
              >
                {t('Nav.signOut')}
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="hidden rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 lg:inline-block"
            >
              {t('Nav.signIn')}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t('Nav.closeMenu') : t('Nav.menu')}
            aria-expanded={menuOpen}
            className="rounded-lg border border-border p-1.5 text-foreground hover:bg-accent lg:hidden"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2">
            {links.map((l) => {
              const active =
                l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-1 border-t border-border pt-1">
              {user ? (
                <>
                  <Link
                    href="/auth"
                    className={`block rounded-md px-3 py-2 text-sm font-medium ${
                      pathname.startsWith('/auth')
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {t('Nav.account')}
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="block w-full rounded-md px-3 py-2 text-start text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {t('Nav.signOut')}
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {t('Nav.signIn')}
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
