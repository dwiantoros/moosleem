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
          background: 'radial-gradient(circle at 15% 10%, #0f766e 0%, #0a2f44 48%, #061320 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 30,
            borderRadius: 34,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            zIndex: 2,
          }}
        >
          <img
            src="https://muslim-traveler.com/logo-muslim-traveler.svg"
            width={290}
            height={290}
            alt="Muslim Traveler logo"
            style={{ borderRadius: 56 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 70, color: '#d1fae5', fontWeight: 700, letterSpacing: '-0.02em' }}>Muslim Traveler</div>
            <div style={{ fontSize: 28, color: '#a7f3d0', marginTop: 6 }}>Prayer Times, Quran, and Halal Companion</div>
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
