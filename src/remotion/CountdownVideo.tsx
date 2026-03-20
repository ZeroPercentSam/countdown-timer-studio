'use client';

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';
import type {ResolvedTimerSpec} from '../spec/ResolvedSpec';

loadFont('italic', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

const pad2 = (n: number) => String(n).padStart(2, '0');

function formatMmSs(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
}

function getDisplayedSeconds(args: {
  direction: 'down' | 'up';
  frame: number;
  fps: number;
  timerFrames: number;
  padBeforeFrames: number;
}) {
  const {direction, frame, fps, timerFrames, padBeforeFrames} = args;
  const localFrame = Math.max(0, frame - padBeforeFrames);
  const clamped = Math.min(timerFrames - 1, localFrame);

  if (direction === 'up') {
    const elapsed = clamped / fps;
    return Math.max(0, Math.floor(elapsed));
  }

  if (clamped >= timerFrames - 1) return 0;
  const remaining = (timerFrames - clamped) / fps;
  return Math.max(0, Math.ceil(remaining));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

function hexPoints(cx: number, cy: number, r: number) {
  const pts: Array<{x: number; y: number}> = [];
  const anglesDeg = [270, 330, 30, 90, 150, 210];
  for (const a of anglesDeg) {
    const rad = (a * Math.PI) / 180;
    pts.push({x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)});
  }
  return pts;
}

function pathFromPoints(points: Array<{x: number; y: number}>) {
  if (points.length === 0) return '';
  const [p0, ...rest] = points;
  const cmds = [`M ${p0.x} ${p0.y}`];
  for (const p of rest) cmds.push(`L ${p.x} ${p.y}`);
  cmds.push('Z');
  return cmds.join(' ');
}

function perimeter(points: Array<{x: number; y: number}>) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return sum;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(a: {x: number; y: number}, b: {x: number; y: number}, t: number) {
  return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)};
}

function pointOnPolygon(points: Array<{x: number; y: number}>, t01: number) {
  const t = ((t01 % 1) + 1) % 1;
  const n = points.length;
  const seg = t * n;
  const i = Math.floor(seg);
  const frac = seg - i;
  const a = points[i % n];
  const b = points[(i + 1) % n];
  return lerpPoint(a, b, frac);
}

function pointOnCircle(cx: number, cy: number, r: number, t01: number) {
  const angle = -Math.PI / 2 + t01 * Math.PI * 2;
  return {x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle)};
}

export const CountdownVideo: React.FC<ResolvedTimerSpec> = (spec) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();

  const padBeforeFrames = Math.round(spec.output.padBeforeSec * fps);
  const padAfterFrames = Math.round(spec.output.padAfterSec * fps);
  const timerFrames = durationInFrames - padBeforeFrames - padAfterFrames;
  const safeTimerFrames = Math.max(1, timerFrames);

  const displaySec = getDisplayedSeconds({
    direction: spec.timer.direction,
    frame,
    fps,
    timerFrames: safeTimerFrames,
    padBeforeFrames,
  });
  const displayText = formatMmSs(displaySec);

  const ring = useMemo(() => {
    const size = Math.min(width, height);
    const cx = width / 2;
    const cy = height / 2 + 20;
    const r = size * 0.28;
    const stroke = Math.max(10, Math.floor(size * 0.03));
    return {cx, cy, r, stroke};
  }, [width, height]);

  const fill = interpolate(
    frame,
    [padBeforeFrames, padBeforeFrames + safeTimerFrames],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const endAngle = 360 * fill;

  const showBlaze = spec.theme.blaze && (frame < padBeforeFrames || fill > 0);
  const blazeT = frame < padBeforeFrames ? 0 : fill;
  const blazeRadius = ring.stroke * 0.75;

  const titleSize = Math.max(26, Math.floor(width * 0.06));
  const timeSize = Math.max(48, Math.floor(width * 0.12));

  const timeTop = height / 2 - 20;
  const timeBottom = timeTop + timeSize;
  const ringBottom = ring.cy + ring.r + ring.stroke / 2;
  const logoHeight = Math.round(timeSize * 0.5);
  const logoCenterY = (timeBottom + ringBottom) / 2;
  const logoTop = logoCenterY - logoHeight / 2;

  const tWithinSecond = (frame % fps) / fps;
  const heartbeatOpacity = interpolate(
    tWithinSecond,
    [0, 1],
    [0.9, 0.05],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: spec.theme.bg,
        color: spec.theme.fg,
        fontFamily: 'Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontStyle: 'italic',
      }}
    >
      {/* Title */}
      {(() => {
        const baseTop = 54;
        const hasTitle2 = Boolean(spec.timer.title2 && spec.timer.title2.trim().length > 0);
        const lineHeight = 1.15;
        const linePx = titleSize * lineHeight;
        const groupTop = hasTitle2 ? baseTop - linePx / 2 : baseTop;

        return (
          <div
            style={{
              position: 'absolute',
              top: groupTop,
              left: 40,
              right: 40,
              textAlign: 'center',
              fontSize: titleSize,
              fontWeight: 600,
              letterSpacing: 0.5,
              lineHeight,
            }}
          >
            <div>{spec.timer.title}</div>
            {hasTitle2 ? <div>{spec.timer.title2}</div> : null}
          </div>
        );
      })()}

      {/* Ring */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: 'absolute', inset: 0}}
      >
        {spec.theme.ringShape === 'circle' ? (
          <>
            <circle
              cx={ring.cx}
              cy={ring.cy}
              r={ring.r}
              fill="none"
              stroke={spec.theme.ringTrack}
              strokeWidth={ring.stroke}
              opacity={0.9}
            />
            {fill > 0 ? (
              <path
                d={describeArc(ring.cx, ring.cy, ring.r, 0, Math.max(0.001, endAngle))}
                fill="none"
                stroke={spec.theme.accent}
                strokeWidth={ring.stroke}
                strokeLinecap="round"
              />
            ) : null}
            {showBlaze ? (() => {
              const p = pointOnCircle(ring.cx, ring.cy, ring.r, blazeT);
              const coreR = blazeRadius;
              const particleCount = 12;
              const base = frame / fps;
              return (
                <>
                  <circle cx={p.x} cy={p.y} r={coreR} fill={spec.theme.accent} opacity={0.95} />
                  {Array.from({length: particleCount}).map((_, i) => {
                    const a = (i / particleCount) * Math.PI * 2;
                    const wobble = 0.5 + 0.5 * Math.sin(base * 7 + i * 1.7);
                    const dist = coreR + ring.stroke * (0.35 + wobble * 0.45);
                    const pr = Math.max(0.8, ring.stroke * (0.08 + wobble * 0.07));
                    const px = p.x + Math.cos(a) * dist;
                    const py = p.y + Math.sin(a) * dist;
                    const op = 0.15 + wobble * 0.25;
                    return <circle key={i} cx={px} cy={py} r={pr} fill={spec.theme.accent} opacity={op} />;
                  })}
                </>
              );
            })() : null}
          </>
        ) : (() => {
          const pts = hexPoints(ring.cx, ring.cy, ring.r);
          const d = pathFromPoints(pts);
          const len = perimeter(pts);
          const dash = len;
          const offset = dash * (1 - fill);
          return (
            <>
              <path d={d} fill="none" stroke={spec.theme.ringTrack} strokeWidth={ring.stroke} opacity={0.9} strokeLinejoin="round" />
              <path d={d} fill="none" stroke={spec.theme.accent} strokeWidth={ring.stroke} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={offset} />
              {showBlaze ? (() => {
                const p = pointOnPolygon(pts, blazeT);
                const coreR = blazeRadius;
                const particleCount = 12;
                const base = frame / fps;
                return (
                  <>
                    <circle cx={p.x} cy={p.y} r={coreR} fill={spec.theme.accent} opacity={0.95} />
                    {Array.from({length: particleCount}).map((_, i) => {
                      const a = (i / particleCount) * Math.PI * 2;
                      const wobble = 0.5 + 0.5 * Math.sin(base * 7 + i * 1.7);
                      const dist = coreR + ring.stroke * (0.35 + wobble * 0.45);
                      const pr = Math.max(0.8, ring.stroke * (0.08 + wobble * 0.07));
                      const px = p.x + Math.cos(a) * dist;
                      const py = p.y + Math.sin(a) * dist;
                      const op = 0.15 + wobble * 0.25;
                      return <circle key={i} cx={px} cy={py} r={pr} fill={spec.theme.accent} opacity={op} />;
                    })}
                  </>
                );
              })() : null}
            </>
          );
        })()}
      </svg>

      {/* Time */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: height / 2 - 20,
          textAlign: 'center',
          fontSize: timeSize,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {displayText}
      </div>

      {/* Logo */}
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

      {/* Audio */}
      {spec.audio.map((a) => (
        <Sequence key={a.id} from={Math.round(a.atSec * fps)}>
          <Audio src={a.src.startsWith('data:') || a.src.startsWith('http') ? a.src : `/${a.src}`} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
