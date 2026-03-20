'use client';

import React from 'react';
import type { ProgramStep } from '../spec/ProgramSpec';
import type { RawEvent } from '../spec/RawSpec';
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

/** Shared event list editor for both timer and transition steps */
const EventsEditor: React.FC<{
  events: RawEvent[];
  durationSec: number;
  onChange: (events: RawEvent[]) => void;
}> = ({ events, durationSec, onChange }) => {

  const addTtsEvent = () => {
    onChange([...events, { type: 'tts', text: '', atSec: 0 }]);
  };

  const addChimeEvent = () => {
    onChange([...events, { type: 'chime', atSec: 0 }]);
  };

  const updateEvent = (i: number, updated: RawEvent) => {
    const next = [...events];
    next[i] = updated;
    onChange(next);
  };

  const removeEvent = (i: number) => {
    onChange(events.filter((_, idx) => idx !== i));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#666' }}>
          Audio Events ({events.length})
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={addTtsEvent} style={eventAddBtn} title="Add a spoken voice line">
            + Voice
          </button>
          <button onClick={addChimeEvent} style={eventAddBtn} title="Add a chime sound">
            + Chime
          </button>
        </div>
      </div>

      {events.map((ev, i) => {
        const isTts = ev.type === 'tts';
        const isFromEnd = 'fromEndSec' in ev;
        const timingValue = isFromEnd
          ? (ev as { fromEndSec: number }).fromEndSec
          : (ev as { atSec: number }).atSec;

        return (
          <div key={i} style={eventCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={eventTypeBadge(isTts ? '#10b981' : '#f59e0b')}>
                {isTts ? 'Voice' : 'Chime'}
              </span>

              {/* Timing mode toggle */}
              <select
                value={isFromEnd ? 'fromEnd' : 'atSec'}
                onChange={(e) => {
                  const mode = e.target.value;
                  if (mode === 'fromEnd') {
                    const { atSec: _removed, ...rest } = ev as Record<string, unknown>;
                    updateEvent(i, { ...rest, fromEndSec: 3 } as unknown as RawEvent);
                  } else {
                    const { fromEndSec: _removed, ...rest } = ev as Record<string, unknown>;
                    updateEvent(i, { ...rest, atSec: 0 } as unknown as RawEvent);
                  }
                }}
                style={{ ...inputStyle, width: 'auto', fontSize: 11, padding: '3px 6px' }}
              >
                <option value="atSec">At second</option>
                <option value="fromEnd">Before end</option>
              </select>

              <input
                type="number"
                min={0}
                max={durationSec}
                step={1}
                value={timingValue}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  if (isFromEnd) {
                    const { fromEndSec: _, ...rest } = ev as Record<string, unknown>;
                    updateEvent(i, { ...rest, fromEndSec: val } as unknown as RawEvent);
                  } else {
                    const { atSec: _, ...rest } = ev as Record<string, unknown>;
                    updateEvent(i, { ...rest, atSec: val } as unknown as RawEvent);
                  }
                }}
                style={{ ...inputStyle, width: 56, fontSize: 12, padding: '3px 6px' }}
              />
              <span style={{ fontSize: 11, color: '#666' }}>
                {isFromEnd ? 'sec before end' : 'sec from start'}
              </span>

              <button
                onClick={() => removeEvent(i)}
                style={{ ...iconBtn, width: 22, height: 22, fontSize: 11, color: '#f87171', marginLeft: 'auto' }}
                title="Remove event"
              >
                x
              </button>
            </div>

            {/* TTS text input */}
            {isTts && (
              <input
                value={(ev as { text: string }).text}
                onChange={(e) => updateEvent(i, { ...ev, text: e.target.value } as RawEvent)}
                placeholder="What should the voice say?"
                style={{ ...inputStyle, width: '100%', marginTop: 6, fontSize: 13 }}
              />
            )}

            {/* Optional voice override for TTS */}
            {isTts && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <label style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Voice:
                  <select
                    value={(ev as { voice?: string }).voice || ''}
                    onChange={(e) => {
                      const voice = e.target.value || undefined;
                      updateEvent(i, { ...ev, voice } as RawEvent);
                    }}
                    style={{ ...inputStyle, width: 'auto', fontSize: 11, padding: '2px 6px' }}
                  >
                    <option value="">Default</option>
                    {['shimmer', 'alloy', 'echo', 'fable', 'onyx', 'nova'].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        );
      })}

      {events.length === 0 && (
        <div style={{ fontSize: 12, color: '#444', fontStyle: 'italic', padding: '4px 0' }}>
          No audio events. Click + Voice to add spoken text or + Chime for a beep.
        </div>
      )}
    </div>
  );
};

export const StepEditor: React.FC<Props> = ({
  step, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
}) => {
  if (isTransition(step)) {
    const events = (step.events ?? []) as RawEvent[];
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

        <EventsEditor
          events={events}
          durationSec={step.durationSec}
          onChange={(newEvents) => onChange(index, { ...step, events: newEvents.length > 0 ? newEvents : undefined })}
        />
      </div>
    );
  }

  // Timer step
  const timerStep = step as Extract<ProgramStep, { use: string }>;
  const events = ((timerStep as Record<string, unknown>).events ?? []) as RawEvent[];
  const durationSec = ((timerStep as Record<string, unknown>).durationSec as number) || 30;

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

      <EventsEditor
        events={events}
        durationSec={durationSec}
        onChange={(newEvents) => onChange(index, { ...timerStep, events: newEvents.length > 0 ? newEvents : undefined })}
      />
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

const eventCardStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid #252525',
  borderRadius: 8,
  padding: 10,
};

const eventTypeBadge = (color: string): React.CSSProperties => ({
  background: color,
  color: '#fff',
  padding: '1px 8px',
  borderRadius: 10,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const eventAddBtn: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#151515',
  color: '#aaa',
  fontSize: 11,
  cursor: 'pointer',
  fontWeight: 600,
};
