'use client';

import React from 'react';
import type { ProgramSpec } from '../spec/ProgramSpec';

type Props = {
  theme: ProgramSpec['themeDefaults'];
  onChange: (theme: Partial<ProgramSpec['themeDefaults']>) => void;
};

const colorFields = [
  { key: 'bg' as const, label: 'Background' },
  { key: 'fg' as const, label: 'Text' },
  { key: 'accent' as const, label: 'Accent' },
  { key: 'ringTrack' as const, label: 'Ring Track' },
];

export const ThemeEditor: React.FC<Props> = ({ theme, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
        Theme
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {colorFields.map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="color"
              value={theme[key] || '#000000'}
              onChange={(e) => onChange({ [key]: e.target.value })}
              style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          Ring:
          <select
            value={theme.ringShape || 'circle'}
            onChange={(e) => onChange({ ringShape: e.target.value as 'circle' | 'hex' })}
            style={selectStyle}
          >
            <option value="circle">Circle</option>
            <option value="hex">Hexagon</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          Logo:
          <select
            value={theme.logoMode || 'static'}
            onChange={(e) => onChange({ logoMode: e.target.value as 'none' | 'static' | 'heartbeat' })}
            style={selectStyle}
          >
            <option value="none">None</option>
            <option value="static">Static</option>
            <option value="heartbeat">Heartbeat</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={theme.blaze || false}
            onChange={(e) => onChange({ blaze: e.target.checked })}
          />
          Blaze Effect
        </label>
      </div>
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ddd',
  fontSize: 13,
};
