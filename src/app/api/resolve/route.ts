import { NextRequest, NextResponse } from 'next/server';
import { ProgramSpecSchema } from '@/spec/ProgramSpec';
import { resolveProgramSpec, type TtsResolver } from '@/lib/resolveProgram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec, generateTts = false } = body;

    const program = ProgramSpecSchema.parse(spec);

    let ttsResolver: TtsResolver | undefined;

    if (generateTts) {
      // TTS resolver that calls our own TTS API route
      const origin = request.nextUrl.origin;
      ttsResolver = async (args) => {
        const resp = await fetch(`${origin}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        });

        if (!resp.ok) {
          throw new Error(`TTS failed: ${resp.statusText}`);
        }

        // Convert to a data URL for the audio
        const buffer = await resp.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:audio/mpeg;base64,${base64}`;
      };
    }

    const resolved = await resolveProgramSpec({
      spec: program,
      ttsResolver,
      assetDict: { 'Get ready to workout': 'workout.m4a' },
    });

    return NextResponse.json(resolved);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resolution failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
