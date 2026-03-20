import {z} from 'zod';
import {RawEventSchema, RawSpecSchemaObject} from './RawSpec';

export const ProgramTimerTemplateSchema = RawSpecSchemaObject.omit({
  output: true,
}).extend({
  output: z
    .object({
      durationSec: z.number().int().positive().optional(),
      padBeforeSec: z.number().nonnegative().default(0),
      padAfterSec: z.number().nonnegative().default(0),
    })
    .default({padBeforeSec: 0, padAfterSec: 0}),
});

export type ProgramTimerTemplate = z.infer<typeof ProgramTimerTemplateSchema>;

export const ProgramTimerStepSchema = z.object({
  use: z.string().min(1),
  title: z.string().optional(),
  title2: z.string().optional(),
  durationSec: z.number().int().positive().optional(),
  padBeforeSec: z.number().nonnegative().optional(),
  padAfterSec: z.number().nonnegative().optional(),
  theme: RawSpecSchemaObject.shape.theme.partial().optional(),
  events: z.array(RawEventSchema).optional(),
});

export const ProgramTransitionStepSchema = z.object({
  type: z.literal('transition'),
  durationSec: z.number().int().positive(),
  text: z.string().min(1),
  text2: z.string().optional(),
  theme: RawSpecSchemaObject.shape.theme.partial().optional(),
  events: z.array(RawEventSchema).optional(),
});

export const ProgramStepSchema = z.union([ProgramTimerStepSchema, ProgramTransitionStepSchema]);
export type ProgramStep = z.infer<typeof ProgramStepSchema>;

const ProgramRootEventSchema = RawEventSchema.refine(
  (ev): ev is Extract<z.infer<typeof RawEventSchema>, {atSec: number}> => 'atSec' in ev,
  {
    message: 'Program-level events must use atSec',
  }
);

export const ProgramSpecSchema = z.object({
  version: z.number().int().default(1),
  output: z.object({
    width: z.number().int().positive().default(512),
    height: z.number().int().positive().default(512),
    fps: z.number().int().positive().default(30),
  }),
  themeDefaults: RawSpecSchemaObject.shape.theme.partial().default({}),
  speechDefaults: RawSpecSchemaObject.shape.speech.optional(),
  timers: z.record(z.string().min(1), ProgramTimerTemplateSchema).default({}),
  steps: z.array(ProgramStepSchema).min(1),
  events: z.array(ProgramRootEventSchema).default([]),
  totalDurationSec: z.number().nonnegative().optional(),
});

export type ProgramSpec = z.infer<typeof ProgramSpecSchema>;
