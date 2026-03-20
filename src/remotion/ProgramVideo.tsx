'use client';

import React from 'react';
import {AbsoluteFill, Audio, Sequence} from 'remotion';
import type {ResolvedProgramSpec} from '../spec/ProgramResolvedSpec';
import {CountdownVideo} from './CountdownVideo';
import {TransitionVideo} from './TransitionVideo';

export const ProgramVideo: React.FC<ResolvedProgramSpec> = (spec) => {
  const fps = spec.output.fps;
  const sortedSegments = [...spec.segments].sort((a, b) => a.startSec - b.startSec);
  const sortedAudio = [...spec.audio].sort((a, b) => a.atSec - b.atSec);

  return (
    <AbsoluteFill>
      {sortedSegments.map((seg, i) => {
        const next = sortedSegments[i + 1];
        const segEndSec = next ? next.startSec : spec.output.totalDurationSec;
        const durationSec = Math.max(0, segEndSec - seg.startSec);
        return (
          <Sequence
            key={seg.id}
            from={Math.round(seg.startSec * fps)}
            durationInFrames={Math.round(durationSec * fps)}
          >
            {seg.type === 'timer' ? (
              <CountdownVideo {...seg.timer} />
            ) : (
              <TransitionVideo {...seg.transition} />
            )}
          </Sequence>
        );
      })}

      {sortedAudio.map((a) => (
        <Sequence key={a.id} from={Math.round(a.atSec * fps)}>
          <Audio src={a.src.startsWith('data:') || a.src.startsWith('http') ? a.src : `/${a.src}`} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
