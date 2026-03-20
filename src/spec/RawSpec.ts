import {z} from 'zod';

const AtSecSchema = z.object({
  atSec: z.number(),
});

const FromEndSecSchema = z.object({
  fromEndSec: z.number().nonnegative(),
});

const RawTtsEventAtSecSchema = z
  .object({
    type: z.literal('tts'),
    text: z.string().min(1),
    voice: z.string().optional(),
    model: z.string().optional(),
  })
  .merge(AtSecSchema);

const RawTtsEventFromEndSecSchema = z
  .object({
    type: z.literal('tts'),
    text: z.string().min(1),
    voice: z.string().optional(),
    model: z.string().optional(),
  })
  .merge(FromEndSecSchema);

const RawAssetEventAtSecSchema = z
  .object({
    type: z.literal('asset'),
    tag: z.string().min(1),
  })
  .merge(AtSecSchema);

const RawAssetEventFromEndSecSchema = z
  .object({
    type: z.literal('asset'),
    tag: z.string().min(1),
  })
  .merge(FromEndSecSchema);

const RawChimeEventAtSecSchema = z.object({
  type: z.literal('chime'),
}).merge(AtSecSchema);

const RawChimeEventFromEndSecSchema = z.object({
  type: z.literal('chime'),
}).merge(FromEndSecSchema);

export const RawEventSchema = z.union([
  RawTtsEventAtSecSchema,
  RawTtsEventFromEndSecSchema,
  RawAssetEventAtSecSchema,
  RawAssetEventFromEndSecSchema,
  RawChimeEventAtSecSchema,
  RawChimeEventFromEndSecSchema,
]);

export const RawSpecBaseSchema = z.object({
  version: z.number().int().default(1),
  output: z.object({
    width: z.number().int().positive().default(512),
    height: z.number().int().positive().default(512),
    fps: z.number().int().positive().default(30),
    durationSec: z.number().int().positive(),
    padBeforeSec: z.number().nonnegative().default(0),
    padAfterSec: z.number().nonnegative().default(0),
  }),
  theme: z.object({
    bg: z.string().default('#201e1d'),
    fg: z.string().default('#d4c7c5'),
    accent: z.string().default('#ff8ea0'),
    ringTrack: z.string().default('#3a3534'),
    ringShape: z.enum(['circle', 'hex']).default('circle'),
    logoMode: z.enum(['none', 'static', 'heartbeat']).default('static'),
    blaze: z.boolean().default(false),
  }),
  timer: z.object({
    title: z.string().default('Timer'),
    title2: z.string().optional(),
    direction: z.enum(['down', 'up']).default('down'),
  }),
  speech: z
    .object({
      provider: z.literal('openai').default('openai'),
      model: z.string().default('gpt-4o-mini-tts'),
      voice: z.string().default('shimmer'),
      trimLeadingSilence: z.boolean().default(true),
      instructions: z
        .string()
        .default(
          'You are an encouraging personal fitness coach. Sound upbeat, confident, and supportive. Deliver short motivating lines with clear pacing and a smile in your voice. Speak the provided text exactly once. Do not add extra words. Do not repeat yourself.'
        ),
    })
    .default({
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      voice: 'shimmer',
      trimLeadingSilence: true,
      instructions:
        'You are an encouraging personal fitness coach. Sound upbeat, confident, and supportive. Deliver short motivating lines with clear pacing and a smile in your voice. Speak the provided text exactly once. Do not add extra words. Do not repeat yourself.',
    }),
  assets: z
    .object({
      chime: z.string().default('soft-chime.wav'),
    })
    .default({chime: 'soft-chime.wav'}),
  events: z.array(RawEventSchema).default([]),
});

export const RawSpecSchemaObject = RawSpecBaseSchema;

export const RawSpecSchemaWithChecks = RawSpecSchemaObject.superRefine((spec, ctx) => {
  const minAt = -spec.output.padBeforeSec;
  const maxAt = spec.output.durationSec + spec.output.padAfterSec;

  for (let i = 0; i < spec.events.length; i++) {
    const ev = spec.events[i];
    const atSec =
      'atSec' in ev
        ? ev.atSec
        : spec.output.durationSec - ev.fromEndSec;

    if (atSec < minAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `events[${i}] is before the pad-before window`,
        path: ['events', i],
      });
    }

    if (atSec > maxAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `events[${i}] exceeds the end of the video`,
        path: ['events', i],
      });
    }
  }
});

export type RawTimerSpec = z.infer<typeof RawSpecSchemaWithChecks>;
export type RawEvent = z.infer<typeof RawEventSchema>;
export {RawSpecSchemaWithChecks as RawSpecSchema};
