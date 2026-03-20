'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 32,
        padding: 40,
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ff8ea0, #ff6b6b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}
      >
        Countdown Timer Studio
      </h1>
      <p style={{ color: '#888', fontSize: 18, maxWidth: 500, textAlign: 'center', lineHeight: 1.6 }}>
        Create animated countdown timer videos with custom themes, TTS voiceover, and program sequences.
        Preview in real-time and export to video.
      </p>
      <Link
        href="/builder"
        style={{
          padding: '14px 36px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #ff8ea0, #ff6b6b)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'transform 0.2s',
        }}
      >
        Open Builder
      </Link>
    </div>
  );
}
