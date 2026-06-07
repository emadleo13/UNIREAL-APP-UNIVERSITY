import { ImageResponse } from 'next/og';
import { repo } from '@/lib/data';
import { computeUniversityScore } from '@/lib/data/score';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'University profile on UNIREAL';

// Per-university social share image. Uses the base (Latin) name + place + score
// so it renders without bundling a Persian/Arabic font.
export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const uni = await repo.getUniversityBySlug(slug);
  const name = uni?.name ?? 'University';
  const place = uni
    ? [uni.city, uni.country].filter(Boolean).join(', ')
    : '';
  const score = uni ? computeUniversityScore(uni) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #b45309 0%, #7c3f08 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4 }}>
          UNIREAL
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>
            {name.length > 70 ? `${name.slice(0, 67)}…` : name}
          </div>
          {place ? (
            <div style={{ fontSize: 36, marginTop: 16, opacity: 0.9 }}>
              {place}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {score ? (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <div style={{ fontSize: 90, fontWeight: 800 }}>
                {Math.round(score.total)}
              </div>
              <div style={{ fontSize: 36, marginLeft: 12, opacity: 0.9 }}>
                / 100 UNIREAL Score
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 32, opacity: 0.9 }}>
              Reviews · Tuition · Deadlines
            </div>
          )}
          <div style={{ fontSize: 28, opacity: 0.8 }}>unireal.study</div>
        </div>
      </div>
    ),
    size
  );
}
