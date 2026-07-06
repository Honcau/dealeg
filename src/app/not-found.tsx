import Link from 'next/link';

// 404 gốc — cho đường dẫn ngoài [locale]. Không có i18n context.
export default function RootNotFound() {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f9fafb', padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div style={{
              fontSize: '5rem', fontWeight: 900,
              background: 'linear-gradient(to bottom right, #4f46e5, #9333ea)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
            }}>404</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Page not found
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/" style={{
              display: 'inline-block', background: '#4f46e5', color: 'white',
              fontWeight: 600, padding: '0.625rem 1.5rem', borderRadius: '0.5rem',
              textDecoration: 'none', fontSize: '0.875rem',
            }}>Back to homepage</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
