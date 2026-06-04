import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
export const alt = 'Organik Gədəbəy – Təzə kənd məhsulları';
export const size = { width: 1200, height: 630 };
 
export default function Image() {
  return new ImageResponse(
    <div style={{ background: '#16a34a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 800, color: 'white' }}>
      🌿 Organik Gədəbəy
    </div>,
    size,
  );
}