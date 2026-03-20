import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, model, voice, instructions } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    const resp = await client.audio.speech.create({
      model: model || 'gpt-4o-mini-tts',
      voice: voice || 'shimmer',
      instructions: instructions || 'Speak clearly and concisely.',
      input: text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await resp.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="tts.mp3"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
