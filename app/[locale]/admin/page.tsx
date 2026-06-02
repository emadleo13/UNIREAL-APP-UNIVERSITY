import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getCurrentUser } from '@/lib/supabase/server';
import { isAdminEmail, isSupabaseConfigured } from '@/lib/supabase/env';
import { getAdminData, type AdminMember } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'active' || status === 'trialing'
      ? 'green'
      : status === 'past_due'
        ? 'primary'
        : 'muted';
  return <Badge tone={tone}>{status}</Badge>;
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Admin');

  // Gate: only the admin email(s), and only when Supabase is configured.
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('notConfigured')}</p>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const { stats, members, expiring } = await getAdminData();

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  const cards = [
    { label: t('members'), value: stats.members },
    { label: t('activeSubs'), value: stats.active },
    { label: t('expiringSoon'), value: stats.expiringSoon },
    { label: t('canceled'), value: stats.canceled },
  ];

  const Row = ({ m }: { m: AdminMember }) => (
    <tr className="border-t border-border">
      <td className="py-2 pe-3">
        <div className="font-medium text-foreground">{m.name || '—'}</div>
        <div className="text-xs text-muted-foreground" dir="ltr">
          {m.email}
        </div>
      </td>
      <td className="py-2 pe-3">
        <StatusBadge status={m.status} />
      </td>
      <td className="py-2 pe-3 text-muted-foreground">{m.plan || '—'}</td>
      <td className="py-2 pe-3 text-muted-foreground">
        {fmtDate(m.currentPeriodEnd)}
        {m.cancelAtPeriodEnd && (
          <span className="ms-1 text-xs text-destructive">({t('cancels')})</span>
        )}
      </td>
      <td className="py-2 text-muted-foreground">{fmtDate(m.createdAt)}</td>
    </tr>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle', { email: user.email ?? '' })}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{c.value}</p>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">{t('expiringTitle')}</h2>
        <Card className="mt-3 overflow-x-auto p-4">
          {expiring.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noExpiring')}</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 text-start">{t('member')}</th>
                  <th className="pb-2 text-start">{t('status')}</th>
                  <th className="pb-2 text-start">{t('plan')}</th>
                  <th className="pb-2 text-start">{t('renews')}</th>
                  <th className="pb-2 text-start">{t('joined')}</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((m) => (
                  <Row key={m.id} m={m} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">{t('membersTitle')}</h2>
        <Card className="mt-3 overflow-x-auto p-4">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noMembers')}</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 text-start">{t('member')}</th>
                  <th className="pb-2 text-start">{t('status')}</th>
                  <th className="pb-2 text-start">{t('plan')}</th>
                  <th className="pb-2 text-start">{t('renews')}</th>
                  <th className="pb-2 text-start">{t('joined')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <Row key={m.id} m={m} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}
