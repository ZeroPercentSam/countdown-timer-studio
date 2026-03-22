/**
 * Client-side video export using html2canvas + WebCodecs + mp4-muxer.
 * Renders the Remotion Player frame-by-frame to produce a downloadable MP4.
 */

import type { ResolvedProgramSpec } from '@/spec/ProgramResolvedSpec';

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding-audio' | 'muxing' | 'done';
  percent: number;
  message: string;
}

export async function exportToMp4(
  playerElement: HTMLElement,
  playerRef: { seekTo: (f: number) => void; pause: () => void },
  resolved: ResolvedProgramSpec,
  onProgress: (p: ExportProgress) => void
): Promise<Blob> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const html2canvas = (await import('html2canvas')).default;

  const { width, height, fps, totalDurationSec } = resolved.output;
  const totalFrames = Math.round(totalDurationSec * fps);

  onProgress({ phase: 'preparing', percent: 0, message: 'Setting up encoder...' });

  // Find the actual player content element (the remotion player renders inside nested divs)
  const playerContent = playerElement.querySelector('[data-remotion-player-container]') as HTMLElement
    || playerElement.querySelector('div > div > div') as HTMLElement
    || playerElement;

  // Set up MP4 muxer
  const hasAudio = resolved.audio.length > 0;
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    audio: hasAudio ? {
      codec: 'aac',
      numberOfChannels: 1,
      sampleRate: 44100,
    } : undefined,
    fastStart: 'in-memory',
  });

  // Set up VideoEncoder
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => console.error('VideoEncoder error:', e),
  });

  videoEncoder.configure({
    codec: 'avc1.42001f',
    width,
    height,
    bitrate: 4_000_000,
    framerate: fps,
  });

  // Create offscreen canvas for frame capture
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // Pause the player so we can seek frame-by-frame
  playerRef.pause();

  onProgress({ phase: 'rendering', percent: 0, message: `Rendering frame 0/${totalFrames}...` });

  // Render each frame
  for (let frame = 0; frame < totalFrames; frame++) {
    playerRef.seekTo(frame);

    // Wait for the Remotion Player to update the DOM
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Capture the player to canvas
    await html2canvas(playerContent, {
      canvas,
      width,
      height,
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#201e1d',
      removeContainer: true,
    });

    // Create VideoFrame and encode
    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round((frame / fps) * 1_000_000),
      duration: Math.round((1 / fps) * 1_000_000),
    });

    const keyFrame = frame % (fps * 2) === 0; // keyframe every 2 seconds
    videoEncoder.encode(videoFrame, { keyFrame });
    videoFrame.close();

    if (frame % 5 === 0) {
      const pct = Math.round((frame / totalFrames) * 100);
      onProgress({
        phase: 'rendering',
        percent: pct,
        message: `Rendering frame ${frame}/${totalFrames} (${pct}%)...`,
      });
      // Yield to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Flush video encoder
  await videoEncoder.flush();
  videoEncoder.close();

  // Encode audio if present
  if (hasAudio) {
    onProgress({ phase: 'encoding-audio', percent: 90, message: 'Encoding audio...' });
    try {
      await encodeAudio(resolved, muxer, totalDurationSec);
    } catch (err) {
      console.warn('Audio encoding failed, exporting video only:', err);
    }
  }

  // Finalize
  onProgress({ phase: 'muxing', percent: 95, message: 'Finalizing MP4...' });
  muxer.finalize();

  const buffer = (muxer.target as InstanceType<typeof ArrayBufferTarget>).buffer;
  const blob = new Blob([buffer], { type: 'video/mp4' });

  onProgress({ phase: 'done', percent: 100, message: 'Export complete!' });
  return blob;
}

async function encodeAudio(
  resolved: ResolvedProgramSpec,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  muxer: any,
  totalDurationSec: number
): Promise<void> {
  const audioContext = new OfflineAudioContext(1, Math.ceil(totalDurationSec * 44100), 44100);

  // Load and schedule all audio clips
  for (const clip of resolved.audio) {
    try {
      const response = await fetch(clip.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(clip.atSec);
    } catch (err) {
      console.warn(`Failed to decode audio clip ${clip.id}:`, err);
    }
  }

  // Render the mixed audio
  const renderedBuffer = await audioContext.startRendering();
  const pcmData = renderedBuffer.getChannelData(0);

  // Encode audio using AudioEncoder
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => {
      muxer.addAudioChunk(chunk, meta);
    },
    error: (e) => console.error('AudioEncoder error:', e),
  });

  audioEncoder.configure({
    codec: 'mp4a.40.2', // AAC-LC
    numberOfChannels: 1,
    sampleRate: 44100,
    bitrate: 128_000,
  });

  // Encode in chunks of 1024 samples (standard AAC frame size)
  const chunkSize = 1024;
  for (let i = 0; i < pcmData.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, pcmData.length);
    const chunk = new Float32Array(chunkSize); // pad with zeros if needed
    chunk.set(pcmData.subarray(i, end));

    const audioData = new AudioData({
      format: 'f32' as AudioSampleFormat,
      sampleRate: 44100,
      numberOfFrames: chunkSize,
      numberOfChannels: 1,
      timestamp: Math.round((i / 44100) * 1_000_000),
      data: chunk,
    });

    audioEncoder.encode(audioData);
    audioData.close();
  }

  await audioEncoder.flush();
  audioEncoder.close();
}

/** Trigger download of a Blob */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
