'use client';

import { useReducer, useCallback } from 'react';
import type { ProgramSpec, ProgramStep } from '../spec/ProgramSpec';
import type { ResolvedProgramSpec } from '../spec/ProgramResolvedSpec';

export type SpecState = {
  spec: ProgramSpec;
  resolved: ResolvedProgramSpec | null;
  resolving: boolean;
  error: string | null;
};

type Action =
  | { type: 'SET_SPEC'; spec: ProgramSpec }
  | { type: 'UPDATE_OUTPUT'; output: Partial<ProgramSpec['output']> }
  | { type: 'UPDATE_THEME_DEFAULTS'; theme: Partial<ProgramSpec['themeDefaults']> }
  | { type: 'UPDATE_SPEECH_DEFAULTS'; speech: Partial<NonNullable<ProgramSpec['speechDefaults']>> }
  | { type: 'SET_STEPS'; steps: ProgramStep[] }
  | { type: 'ADD_STEP'; step: ProgramStep }
  | { type: 'REMOVE_STEP'; index: number }
  | { type: 'UPDATE_STEP'; index: number; step: ProgramStep }
  | { type: 'MOVE_STEP'; from: number; to: number }
  | { type: 'RESOLVE_START' }
  | { type: 'RESOLVE_SUCCESS'; resolved: ResolvedProgramSpec }
  | { type: 'RESOLVE_ERROR'; error: string };

const DEFAULT_SPEC: ProgramSpec = {
  version: 1,
  output: { width: 512, height: 512, fps: 30 },
  themeDefaults: {
    bg: '#201e1d',
    fg: '#d4c7c5',
    accent: '#ff8ea0',
    ringTrack: '#3a3534',
    ringShape: 'hex',
    logoMode: 'heartbeat',
    blaze: true,
  },
  timers: {},
  steps: [
    {
      use: 'blaze_hex',
      title: 'Workout',
      durationSec: 30,
    },
  ],
  events: [],
};

function reducer(state: SpecState, action: Action): SpecState {
  switch (action.type) {
    case 'SET_SPEC':
      return { ...state, spec: action.spec, resolved: null, error: null };
    case 'UPDATE_OUTPUT':
      return {
        ...state,
        spec: { ...state.spec, output: { ...state.spec.output, ...action.output } },
        resolved: null,
      };
    case 'UPDATE_THEME_DEFAULTS':
      return {
        ...state,
        spec: {
          ...state.spec,
          themeDefaults: { ...state.spec.themeDefaults, ...action.theme },
        },
        resolved: null,
      };
    case 'UPDATE_SPEECH_DEFAULTS':
      return {
        ...state,
        spec: {
          ...state.spec,
          speechDefaults: { ...(state.spec.speechDefaults ?? {}), ...action.speech } as ProgramSpec['speechDefaults'],
        },
        resolved: null,
      };
    case 'SET_STEPS':
      return { ...state, spec: { ...state.spec, steps: action.steps }, resolved: null };
    case 'ADD_STEP':
      return {
        ...state,
        spec: { ...state.spec, steps: [...state.spec.steps, action.step] },
        resolved: null,
      };
    case 'REMOVE_STEP': {
      const steps = state.spec.steps.filter((_, i) => i !== action.index);
      if (steps.length === 0) return state;
      return { ...state, spec: { ...state.spec, steps }, resolved: null };
    }
    case 'UPDATE_STEP': {
      const steps = [...state.spec.steps];
      steps[action.index] = action.step;
      return { ...state, spec: { ...state.spec, steps }, resolved: null };
    }
    case 'MOVE_STEP': {
      const steps = [...state.spec.steps];
      const [moved] = steps.splice(action.from, 1);
      steps.splice(action.to, 0, moved);
      return { ...state, spec: { ...state.spec, steps }, resolved: null };
    }
    case 'RESOLVE_START':
      return { ...state, resolving: true, error: null };
    case 'RESOLVE_SUCCESS':
      return { ...state, resolving: false, resolved: action.resolved };
    case 'RESOLVE_ERROR':
      return { ...state, resolving: false, error: action.error };
    default:
      return state;
  }
}

export function useSpec() {
  const [state, dispatch] = useReducer(reducer, {
    spec: DEFAULT_SPEC,
    resolved: null,
    resolving: false,
    error: null,
  });

  const resolve = useCallback(async (generateTts = false) => {
    dispatch({ type: 'RESOLVE_START' });
    try {
      const resp = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: state.spec, generateTts }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Resolution failed');
      }
      const resolved = await resp.json();
      dispatch({ type: 'RESOLVE_SUCCESS', resolved });
      return resolved;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'RESOLVE_ERROR', error: message });
      return null;
    }
  }, [state.spec]);

  return { state, dispatch, resolve };
}
