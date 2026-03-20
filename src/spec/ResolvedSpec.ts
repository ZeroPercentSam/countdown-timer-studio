export type ResolvedAudioClip = {
  id: string;
  atSec: number;
  /** URL or path to audio file. */
  src: string;
};

export type ResolvedTimerSpec = {
  output: {
    width: number;
    height: number;
    fps: number;
    durationSec: number;
    padBeforeSec: number;
    padAfterSec: number;
  };
  theme: {
    bg: string;
    fg: string;
    accent: string;
    ringTrack: string;
    ringShape: 'circle' | 'hex';
    logoMode: 'none' | 'static' | 'heartbeat';
    blaze: boolean;
  };
  timer: {
    title: string;
    title2?: string;
    direction: 'down' | 'up';
  };
  audio: ResolvedAudioClip[];
};
