'use client';

import React from 'react';
import {Composition} from 'remotion';
import {CountdownVideo} from './CountdownVideo';
import {ProgramVideo} from './ProgramVideo';
import type {ResolvedTimerSpec} from '../spec/ResolvedSpec';
import type {ResolvedProgramSpec} from '../spec/ProgramResolvedSpec';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="CountdownTimer"
        component={CountdownVideo as React.FC<Record<string, unknown>>}
        width={512}
        height={512}
        fps={30}
        durationInFrames={120 * 30}
        calculateMetadata={({props}) => {
          const p = props as unknown as ResolvedTimerSpec;
          return {
            width: p.output.width,
            height: p.output.height,
            fps: p.output.fps,
            durationInFrames:
              (p.output.durationSec + p.output.padBeforeSec + p.output.padAfterSec) *
              p.output.fps,
          };
        }}
        defaultProps={
          {
            output: {
              width: 512,
              height: 512,
              fps: 30,
              durationSec: 120,
              padBeforeSec: 0,
              padAfterSec: 0,
            },
            theme: {
              bg: '#201e1d',
              fg: '#d4c7c5',
              accent: '#ff8ea0',
              ringTrack: '#3a3534',
              ringShape: 'circle',
              logoMode: 'static',
              blaze: false,
            },
            timer: {title: 'Timer', direction: 'down'},
            audio: [],
          } as Record<string, unknown>
        }
      />

      <Composition
        id="Program"
        component={ProgramVideo as React.FC<Record<string, unknown>>}
        width={512}
        height={512}
        fps={30}
        durationInFrames={60 * 30}
        calculateMetadata={({props}) => {
          const p = props as unknown as ResolvedProgramSpec;
          return {
            width: p.output.width,
            height: p.output.height,
            fps: p.output.fps,
            durationInFrames: Math.round(p.output.totalDurationSec * p.output.fps),
          };
        }}
        defaultProps={
          {
            output: {width: 512, height: 512, fps: 30, totalDurationSec: 60},
            segments: [],
            audio: [],
          } as Record<string, unknown>
        }
      />
    </>
  );
};
