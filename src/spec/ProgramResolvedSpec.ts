import type {ResolvedAudioClip, ResolvedTimerSpec} from './ResolvedSpec';

export type ResolvedTransitionSpec = {
  output: {
    width: number;
    height: number;
    fps: number;
    durationSec: number;
  };
  theme: ResolvedTimerSpec['theme'];
  transition: {
    text: string;
    text2?: string;
  };
};

export type ResolvedProgramSegment =
  | {
      id: string;
      type: 'timer';
      startSec: number;
      timer: ResolvedTimerSpec;
    }
  | {
      id: string;
      type: 'transition';
      startSec: number;
      transition: ResolvedTransitionSpec;
    };

export type ResolvedProgramSpec = {
  output: {
    width: number;
    height: number;
    fps: number;
    totalDurationSec: number;
  };
  segments: ResolvedProgramSegment[];
  audio: ResolvedAudioClip[];
};
