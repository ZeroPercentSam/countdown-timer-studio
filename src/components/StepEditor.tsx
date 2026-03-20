'use client';

import React from 'react';
import type { ProgramStep } from '../spec/ProgramSpec';
import { BUILT_IN_TEMPLATES } from '../lib/templates';

type Props = {
  step: ProgramStep;
  index: number;
  onChange: (index: number, step: ProgramStep) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
};

const isTransition = (step: ProgramStep): step is Extract<ProgramStep, { type: 'transition' }> =>
  (step as Record<string, unknown>).type === 'transition';

export const StepEditor: React.FC<Props> = ({
  step, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
}) => {
  if (isTransition(step)) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={badgeStyle('#6366f1')}>Transition</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {!isFirst && <button onClick={() => onMoveUp(index)} style={iconBtn} title="Move up">^</button>}
            {!isLast && <button onClick={() => onMoveDown(index)} style={iconBtn} title="Move down">v</button>}
            <button onClick={() => onRemove(index)} style={{...iconBtn, color: '#f87171'}} title="Remove">x</button>
          </div>
        </div>
        <div style={fieldsGrid}>
          <label style={fieldLabel}>
            Text
            <input
              value={step.text}
              onChange={(e) => onChange(index, { ...step, text: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={fieldLabel}>
            Subtitle
            <input
              value={step.text2 || ''}
              onChange={(e) => onChange(index, { ...step, text2: e.target.value || undefined })}
              style={inputStyle}
              placeholder="Optional"
            />
          </label>
          <label style={fieldLabel}>
            Duration (sec)
            <input
              type="number"
              min={1}
              value={step.durationSec}
              onChange={(e) => onChange(index, { ...step, durationSec: Math.max(1, parseInt(e.target.value) || 1) })}
              style={{ ...inputStyle, width: 80 }}
            />
          </label>
        </div>
      </div>
    );
  }

  // Timer step
  const timerStep = step as Extract<ProgramStep, { use: string }>;
  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={badgeStyle('#f59e0b')}>Timer</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isFirst && <button onClick={() => onMoveUp(index)} style={iconBtn} title="Move up">^</button>}
          {!isLast && <button onClick={() => onMoveDown(index)} style={iconBtn} title="Move down">v</button>}
          <button onClick={() => onRemove(index)} style={{...iconBtn, color: '#f87171'}} title="Remove">x</button>
        </div>
      </div>
      <div style={fieldsGrid}>
        <label style={fieldLabel}>
          Template
          <select
            value={timerStep.use}
            onChange={(e) => onChange(index, { ...timerStep, use: e.target.value })}
            style={inputStyle}
          >
            {Object.keys(BUILT_IN_TEMPLATES).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </label>
        <label style={fieldLabel}>
          Title
          <input
            value={timerStep.title || ''}
            onChange={(e) => onChange(index, { ...timerStep, title: e.target.value || undefined })}
            style={inputStyle}
            placeholder="Override template title"
          />
        </label>
        <label style={fieldLabel}>
          Subtitle
          <input
            value={timerStep.title2 || ''}
            onChange={(e) => onChange(index, { ...timerStep, title2: e.target.value || undefined })}
            style={inputStyle}
            placeholder="Optional"
          />
        </label>
        <label style={fieldLabel}>
          Duration (sec)
          <input
            type="number"
            min={1}
            value={timerStep.durationSec || ''}
            onChange={(e) => onChange(index, { ...timerStep, durationSec: Math.max(1, parseInt(e.target.value) || 1) })}
            style={{ ...inputStyle, width: 80 }}
            placeholder="Required"
          />
        </label>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const badgeStyle = (color: string): React.CSSProperties => ({
  background: color,
  color: '#fff',
  padding: '2px 10px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const fieldsGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  color: '#999',
  flex: '1 1 120px',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#111',
  color: '#ddd',
  fontSize: 13,
  outline: 'none',
};

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#999',
  cursor: 'pointer',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 700,
};
