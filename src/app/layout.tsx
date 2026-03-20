import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Countdown Timer Studio',
  description: 'Create and render animated countdown timer videos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0a0a0a',
          color: '#e0e0e0',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
