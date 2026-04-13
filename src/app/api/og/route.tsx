import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 20% 20%, #0f766e 0%, #0b3a4f 45%, #051923 100%)',
          color: '#e2e8f0',
          fontSize: 58,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 36,
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'linear-gradient(150deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            zIndex: 2,
          }}
        >
          <img
            src="https://muslim-traveler.com/logo-muslim-traveler.svg"
            width={168}
            height={168}
            alt="Muslim Traveler logo"
            style={{ borderRadius: 24 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 66, color: '#d1fae5' }}>Muslim Traveler</div>
            <div style={{ fontSize: 30, color: '#93c5fd', marginTop: 8 }}>Prayer Times, Quran, and Halal Companion</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
