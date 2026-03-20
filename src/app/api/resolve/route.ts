import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ProgramSpecSchema } from '@/spec/ProgramSpec';
import { resolveProgramSpec, type TtsResolver } from '@/lib/resolveProgram';

export const maxDuration = 60; // Allow up to 60s for TTS generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec, generateTts = false } = body;

    const program = ProgramSpecSchema.parse(spec);

    let ttsResolver: TtsResolver | undefined;

    if (generateTts) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY not configured on the server' },
          { status: 500 }
        );
      }

      const client = new OpenAI({ apiKey });

      // Cache within this request to avoid duplicate TTS calls for the same text
      const cache = new Map<string, string>();

      ttsResolver = async (args) => {
        const cacheKey = `${args.voice}|${args.model}|${args.text}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const resp = await client.audio.speech.create({
          model: args.model || 'gpt-4o-mini-tts',
          voice: args.voice || 'shimmer',
          instructions: args.instructions || 'Speak clearly and concisely.',
          input: args.text,
          response_format: 'mp3',
        });

        const buffer = Buffer.from(await resp.arrayBuffer());
        const base64 = buffer.toString('base64');
        const dataUrl = `data:audio/mpeg;base64,${base64}`;

        cache.set(cacheKey, dataUrl);
        return dataUrl;
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
    console.error('Resolve error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
