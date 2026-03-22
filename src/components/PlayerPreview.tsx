'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Player } from '@remotion/player';
import { ProgramVideo } from '../remotion/ProgramVideo';
import { CountdownVideo } from '../remotion/CountdownVideo';
import type { ResolvedProgramSpec } from '../spec/ProgramResolvedSpec';
import type { ResolvedTimerSpec } from '../spec/ResolvedSpec';

type Props = {
  resolved: ResolvedProgramSpec | null;
  width?: number;
  height?: number;
};

export type PlayerPreviewHandle = {
  seekTo: (frame: number) => void;
  pause: () => void;
  play: () => void;
  getContainerElement: () => HTMLElement | null;
};

const DEFAULT_TIMER: ResolvedTimerSpec = {
  output: { width: 512, height: 512, fps: 30, durationSec: 30, padBeforeSec: 0, padAfterSec: 0 },
  theme: {
    bg: '#201e1d',
    fg: '#d4c7c5',
    accent: '#ff8ea0',
    ringTrack: '#3a3534',
    ringShape: 'hex',
    logoMode: 'heartbeat',
    blaze: true,
  },
  timer: { title: 'Preview', direction: 'down' },
  audio: [],
};

export const PlayerPreview = forwardRef<PlayerPreviewHandle, Props>(
  ({ resolved, width = 400, height = 400 }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevResolvedRef = useRef<ResolvedProgramSpec | null>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (frame: number) => playerRef.current?.seekTo(frame),
      pause: () => playerRef.current?.pause(),
      play: () => playerRef.current?.play(),
      getContainerElement: () => containerRef.current,
    }));

    // Auto-play from the start when a new resolved spec arrives
    useEffect(() => {
      if (resolved && resolved !== prevResolvedRef.current && playerRef.current) {
        prevResolvedRef.current = resolved;
        setTimeout(() => {
          playerRef.current?.seekTo(0);
          playerRef.current?.play();
        }, 100);
      }
    }, [resolved]);

    if (!resolved) {
      return (
        <div
          ref={containerRef}
          style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
        >
          <Player
            component={CountdownVideo}
            inputProps={DEFAULT_TIMER}
            durationInFrames={30 * 30}
            compositionWidth={512}
            compositionHeight={512}
            fps={30}
            style={{ width, height }}
            controls
            loop
            acknowledgeRemotionLicense
          />
        </div>
      );
    }

    const totalFrames = Math.round(resolved.output.totalDurationSec * resolved.output.fps);

    return (
      <div
        ref={containerRef}
        style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        <Player
          ref={playerRef}
          component={ProgramVideo}
          inputProps={resolved}
          durationInFrames={Math.max(1, totalFrames)}
          compositionWidth={resolved.output.width}
          compositionHeight={resolved.output.height}
          fps={resolved.output.fps}
          style={{ width, height }}
          controls
          loop
          acknowledgeRemotionLicense
        />
      </div>
    );
  }
);

PlayerPreview.displayName = 'PlayerPreview';
