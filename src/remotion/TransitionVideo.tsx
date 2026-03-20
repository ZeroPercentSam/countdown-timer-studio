'use client';

import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';
import type {ResolvedTransitionSpec} from '../spec/ProgramResolvedSpec';

loadFont('italic', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

export const TransitionVideo: React.FC<ResolvedTransitionSpec> = (spec) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const titleSize = Math.max(26, Math.floor(width * 0.06));
  const timerTimeSize = Math.max(48, Math.floor(width * 0.12));

  const timeTop = height / 2 - 20;
  const timeBottom = timeTop + timerTimeSize;

  const hasText2 = Boolean(spec.transition.text2 && spec.transition.text2.trim().length > 0);
  const lineHeight = 1.15;
  const linePx = titleSize * lineHeight;
  const groupTop = hasText2 ? timeBottom - 2 * linePx : timeTop;

  const ringCy = height / 2 + 20;
  const ringR = Math.min(width, height) * 0.28;
  const ringStroke = Math.max(10, Math.floor(Math.min(width, height) * 0.03));
  const ringBottom = ringCy + ringR + ringStroke / 2;

  const logoHeight = Math.round(timerTimeSize * 0.5);
  const logoCenterY = (timeBottom + ringBottom) / 2;
  const logoTop = logoCenterY - logoHeight / 2;

  const tWithinSecond = (frame % fps) / fps;
  const heartbeatOpacity = interpolate(tWithinSecond, [0, 1], [0.9, 0.05], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: spec.theme.bg,
        color: spec.theme.fg,
        fontFamily: 'Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontStyle: 'italic',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          top: groupTop,
          textAlign: 'center',
          fontSize: titleSize,
          fontWeight: 600,
          lineHeight,
          letterSpacing: 0.5,
          whiteSpace: 'pre-line',
        }}
      >
        <div>{spec.transition.text}</div>
        {hasText2 ? <div>{spec.transition.text2}</div> : null}
      </div>

      {spec.theme.logoMode === 'none' ? null : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: logoTop,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <Img
            src="/assets/hds-white.png"
            style={{
              height: logoHeight,
              width: 'auto',
              opacity: spec.theme.logoMode === 'heartbeat' ? heartbeatOpacity : 0.9,
              filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.35))',
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
