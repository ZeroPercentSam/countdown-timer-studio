'use client';

import React from 'react';
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

const DEFAULT_TIMER: ResolvedTimerSpec = {
  output: { width: 512, height: 512, fps: 30, durationSec: 30, padBeforeSec: 0, padAfterSec: 0 },
  theme: {
    bg: '#201e1d',
    fg: '#d4c7c5',
    accent: '#ff8ea0',
    ringTrack: '#3a3534',
    ringShape: 'circle',
    logoMode: 'static',
    blaze: false,
  },
  timer: { title: 'Preview', direction: 'down' },
  audio: [],
};

export const PlayerPreview: React.FC<Props> = ({ resolved, width = 400, height = 400 }) => {
  if (!resolved) {
    // Show a default single timer preview
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
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
    <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <Player
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
};
