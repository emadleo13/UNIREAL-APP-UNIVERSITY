import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'UNIREAL — real university reviews, scores and admission info';

// Site-wide social share image. Latin-only text so it renders without bundling
// a Persian/Arabic font; per-university pages override this with their own.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #b45309 0%, #7c3f08 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2 }}>
          UNIREAL
        </div>
        <div style={{ fontSize: 40, marginTop: 12, opacity: 0.95 }}>
          Real university reviews, scores &amp; admission info
        </div>
        <div style={{ fontSize: 28, marginTop: 36, opacity: 0.8 }}>
          unireal.study
        </div>
      </div>
    ),
    size
  );
}
