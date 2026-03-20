import type {ProgramTimerTemplate} from '../spec/ProgramSpec';

/** Built-in timer templates ported from YAML files */
export const BUILT_IN_TEMPLATES: Record<string, ProgramTimerTemplate> = {
  blaze_hex: {
    version: 1,
    output: { padBeforeSec: 0, padAfterSec: 0 },
    theme: {
      bg: '#201e1d',
      fg: '#d4c7c5',
      accent: '#ff8ea0',
      ringTrack: '#3a3534',
      ringShape: 'hex',
      logoMode: 'heartbeat',
      blaze: true,
    },
    timer: { title: 'override', direction: 'down' },
    speech: {
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer',
      trimLeadingSilence: true,
      instructions:
        'You are an encouraging personal fitness coach. Sound upbeat, confident, and supportive. Deliver short motivating lines with clear pacing and a smile in your voice. Speak the provided text exactly once. Do not add extra words. Do not repeat yourself.',
    },
    assets: { chime: 'soft-chime.wav' },
    events: [
      { fromEndSec: 3, type: 'chime' as const },
      { fromEndSec: 2, type: 'chime' as const },
      { fromEndSec: 1, type: 'chime' as const },
    ],
  },
  rest_hex: {
    version: 1,
    output: { padBeforeSec: 0, padAfterSec: 0 },
    theme: {
      bg: '#201e1d',
      fg: '#d4c7c5',
      accent: '#ff8ea0',
      ringTrack: '#3a3534',
      ringShape: 'hex',
      logoMode: 'static',
      blaze: false,
    },
    timer: { title: 'override', direction: 'down' },
    speech: {
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer',
      trimLeadingSilence: true,
      instructions:
        'You are an encouraging personal fitness coach. Sound upbeat, confident, and supportive. Deliver short motivating lines with clear pacing and a smile in your voice. Speak the provided text exactly once. Do not add extra words. Do not repeat yourself.',
    },
    assets: { chime: 'soft-chime.wav' },
    events: [
      { fromEndSec: 3, type: 'chime' as const },
      { fromEndSec: 2, type: 'chime' as const },
      { fromEndSec: 1, type: 'chime' as const },
    ],
  },
  hard_circle: {
    version: 1,
    output: { padBeforeSec: 0, padAfterSec: 0 },
    theme: {
      bg: '#201e1d',
      fg: '#d4c7c5',
      accent: '#ff4444',
      ringTrack: '#3a3534',
      ringShape: 'circle',
      logoMode: 'heartbeat',
      blaze: true,
    },
    timer: { title: 'Hard Effort', direction: 'down' },
    speech: {
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer',
      trimLeadingSilence: true,
      instructions:
        'You are an encouraging personal fitness coach. Sound upbeat, confident, and supportive.',
    },
    assets: { chime: 'soft-chime.wav' },
    events: [
      { fromEndSec: 3, type: 'chime' as const },
      { fromEndSec: 2, type: 'chime' as const },
      { fromEndSec: 1, type: 'chime' as const },
    ],
  },
  rest_circle: {
    version: 1,
    output: { padBeforeSec: 0, padAfterSec: 0 },
    theme: {
      bg: '#201e1d',
      fg: '#d4c7c5',
      accent: '#4ecdc4',
      ringTrack: '#3a3534',
      ringShape: 'circle',
      logoMode: 'static',
      blaze: false,
    },
    timer: { title: 'Rest', direction: 'down' },
    speech: {
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer',
      trimLeadingSilence: true,
      instructions:
        'You are a calm, supportive coach. Speak gently and encouragingly.',
    },
    assets: { chime: 'soft-chime.wav' },
    events: [
      { fromEndSec: 3, type: 'chime' as const },
      { fromEndSec: 2, type: 'chime' as const },
      { fromEndSec: 1, type: 'chime' as const },
    ],
  },
};
