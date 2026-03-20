'use client';

import React, { useCallback, useRef } from 'react';
import { useSpec } from '@/hooks/useSpec';
import { PlayerPreview } from '@/components/PlayerPreview';
import { ThemeEditor } from '@/components/ThemeEditor';
import { StepEditor } from '@/components/StepEditor';
import { ExportButton } from '@/components/ExportButton';
import type { ProgramStep } from '@/spec/ProgramSpec';
import { BUILT_IN_TEMPLATES } from '@/lib/templates';

export default function BuilderPage() {
  const { state, dispatch, resolve } = useSpec();
  const playerRef = useRef<HTMLDivElement>(null);

  const handleAddTimer = useCallback(() => {
    dispatch({
      type: 'ADD_STEP',
      step: {
        use: Object.keys(BUILT_IN_TEMPLATES)[0],
        title: 'New Timer',
        durationSec: 30,
      },
    });
  }, [dispatch]);

  const handleAddTransition = useCallback(() => {
    dispatch({
      type: 'ADD_STEP',
      step: {
        type: 'transition' as const,
        text: 'Get Ready',
        durationSec: 5,
      },
    });
  }, [dispatch]);

  const handleStepChange = useCallback(
    (index: number, step: ProgramStep) => {
      dispatch({ type: 'UPDATE_STEP', index, step });
    },
    [dispatch]
  );

  const handleStepRemove = useCallback(
    (index: number) => {
      dispatch({ type: 'REMOVE_STEP', index });
    },
    [dispatch]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) dispatch({ type: 'MOVE_STEP', from: index, to: index - 1 });
    },
    [dispatch]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < state.spec.steps.length - 1) dispatch({ type: 'MOVE_STEP', from: index, to: index + 1 });
    },
    [dispatch, state.spec.steps.length]
  );

  const handlePreview = useCallback(async () => {
    await resolve(false);
  }, [resolve]);

  const handlePreviewWithAudio = useCallback(async () => {
    await resolve(true);
  }, [resolve]);

  const handleExport = useCallback(async () => {
    // Resolve with TTS first
    const resolved = await resolve(true);
    if (!resolved) return;

    // For now, show instructions. In production, this would trigger Remotion Lambda.
    alert(
      'Video resolved successfully!\n\n' +
      'To export as MP4, configure Remotion Lambda (AWS) or use a screen recording of the player.\n\n' +
      'Total duration: ' + resolved.output.totalDurationSec + ' seconds\n' +
      'Segments: ' + resolved.segments.length
    );
  }, [resolve]);

  // Calculate total duration from steps
  const totalDuration = state.spec.steps.reduce((sum, step) => {
    if ((step as Record<string, unknown>).type === 'transition') {
      return sum + (step as Extract<ProgramStep, { type: 'transition' }>).durationSec;
    }
    return sum + ((step as Record<string, unknown>).durationSec as number || 0);
  }, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Panel: Editor */}
      <div
        style={{
          flex: 1,
          maxWidth: 560,
          padding: 24,
          overflowY: 'auto',
          borderRight: '1px solid #1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Timer Builder</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
            Total: {totalDuration}s ({Math.floor(totalDuration / 60)}m {totalDuration % 60}s)
          </p>
        </div>

        {/* Output Settings */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={compactLabel}>
            Width
            <input
              type="number"
              value={state.spec.output.width}
              onChange={(e) => dispatch({ type: 'UPDATE_OUTPUT', output: { width: parseInt(e.target.value) || 512 } })}
              style={compactInput}
            />
          </label>
          <label style={compactLabel}>
            Height
            <input
              type="number"
              value={state.spec.output.height}
              onChange={(e) => dispatch({ type: 'UPDATE_OUTPUT', output: { height: parseInt(e.target.value) || 512 } })}
              style={compactInput}
            />
          </label>
          <label style={compactLabel}>
            FPS
            <input
              type="number"
              value={state.spec.output.fps}
              onChange={(e) => dispatch({ type: 'UPDATE_OUTPUT', output: { fps: parseInt(e.target.value) || 30 } })}
              style={compactInput}
            />
          </label>
        </div>

        {/* Theme */}
        <ThemeEditor
          theme={state.spec.themeDefaults}
          onChange={(theme) => dispatch({ type: 'UPDATE_THEME_DEFAULTS', theme })}
        />

        {/* Speech Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
            Voice
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={compactLabel}>
              Voice
              <select
                value={state.spec.speechDefaults?.voice || 'shimmer'}
                onChange={(e) => dispatch({ type: 'UPDATE_SPEECH_DEFAULTS', speech: { voice: e.target.value } })}
                style={compactInput}
              >
                {['shimmer', 'alloy', 'echo', 'fable', 'onyx', 'nova'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label style={compactLabel}>
              Model
              <select
                value={state.spec.speechDefaults?.model || 'gpt-4o-mini-tts'}
                onChange={(e) => dispatch({ type: 'UPDATE_SPEECH_DEFAULTS', speech: { model: e.target.value } })}
                style={compactInput}
              >
                <option value="gpt-4o-mini-tts">gpt-4o-mini-tts</option>
                <option value="tts-1">tts-1</option>
                <option value="tts-1-hd">tts-1-hd</option>
              </select>
            </label>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
              Steps ({state.spec.steps.length})
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAddTimer} style={addBtn}>+ Timer</button>
              <button onClick={handleAddTransition} style={addBtn}>+ Transition</button>
            </div>
          </div>

          {state.spec.steps.map((step, i) => (
            <StepEditor
              key={i}
              step={step}
              index={i}
              onChange={handleStepChange}
              onRemove={handleStepRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={i === 0}
              isLast={i === state.spec.steps.length - 1}
            />
          ))}
        </div>

        {/* Import YAML */}
        <details style={{ fontSize: 13, color: '#888' }}>
          <summary style={{ cursor: 'pointer' }}>Import/Export YAML</summary>
          <textarea
            style={{
              width: '100%',
              height: 200,
              marginTop: 8,
              background: '#111',
              color: '#ddd',
              border: '1px solid #333',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'vertical',
            }}
            placeholder="Paste YAML spec here and click Import..."
            id="yaml-import"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={async () => {
                const el = document.getElementById('yaml-import') as HTMLTextAreaElement;
                try {
                  const YAML = (await import('yaml')).default;
                  const parsed = YAML.parse(el.value);
                  const { ProgramSpecSchema } = await import('@/spec/ProgramSpec');
                  const spec = ProgramSpecSchema.parse(parsed);
                  dispatch({ type: 'SET_SPEC', spec });
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Parse failed';
                  alert('Import error: ' + message);
                }
              }}
              style={addBtn}
            >
              Import
            </button>
            <button
              onClick={async () => {
                const YAML = (await import('yaml')).default;
                const el = document.getElementById('yaml-import') as HTMLTextAreaElement;
                el.value = YAML.stringify(state.spec);
              }}
              style={addBtn}
            >
              Export to YAML
            </button>
          </div>
        </details>
      </div>

      {/* Right Panel: Preview */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 24,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
        ref={playerRef}
      >
        <PlayerPreview
          resolved={state.resolved}
          width={Math.min(450, state.spec.output.width)}
          height={Math.min(450, state.spec.output.height)}
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={handlePreview} disabled={state.resolving} style={previewBtn}>
            {state.resolving ? 'Resolving...' : 'Preview'}
          </button>
          <button onClick={handlePreviewWithAudio} disabled={state.resolving} style={previewBtn}>
            {state.resolving ? 'Resolving...' : 'Preview + Audio'}
          </button>
          <ExportButton onExport={handleExport} disabled={state.resolving} />
        </div>

        {state.error && (
          <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>
            {state.error}
          </div>
        )}

        {state.resolved && (
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
            {state.resolved.segments.length} segments |{' '}
            {state.resolved.output.totalDurationSec}s total |{' '}
            {state.resolved.audio.length} audio clips
          </div>
        )}
      </div>
    </div>
  );
}

const compactLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  color: '#999',
};

const compactInput: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#111',
  color: '#ddd',
  fontSize: 13,
  width: 80,
  outline: 'none',
};

const addBtn: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ddd',
  fontSize: 12,
  cursor: 'pointer',
  fontWeight: 600,
};

const previewBtn: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 8,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ddd',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
