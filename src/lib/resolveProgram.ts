import {
  ProgramSpecSchema,
  type ProgramSpec,
  type ProgramTimerTemplate,
} from '../spec/ProgramSpec';
import {RawSpecSchema, RawSpecSchemaObject, type RawTimerSpec, type RawEvent} from '../spec/RawSpec';
import type {ResolvedAudioClip, ResolvedTimerSpec} from '../spec/ResolvedSpec';
import type {ResolvedProgramSpec, ResolvedTransitionSpec} from '../spec/ProgramResolvedSpec';
import {BUILT_IN_TEMPLATES} from './templates';

export type TtsResolver = (args: {
  text: string;
  model: string;
  voice: string;
  instructions: string;
}) => Promise<string>; // returns a URL/path to the audio

function mergeTheme(defaults: Record<string, unknown>, overrides?: Record<string, unknown>) {
  return {...defaults, ...(overrides ?? {})};
}

function mergeTimerTemplate(args: {
  program: ProgramSpec;
  template: ProgramTimerTemplate;
  step: {
    title?: string;
    title2?: string;
    durationSec?: number;
    padBeforeSec?: number;
    padAfterSec?: number;
    theme?: Record<string, unknown>;
    events?: RawEvent[];
  };
}): RawTimerSpec {
  const templateDurationSec = (args.template as Record<string, unknown> & {output?: {durationSec?: number}}).output?.durationSec;
  const finalDurationSec =
    typeof args.step.durationSec === 'number'
      ? args.step.durationSec
      : typeof templateDurationSec === 'number'
        ? templateDurationSec
        : undefined;

  if (typeof finalDurationSec !== 'number') {
    throw new Error(
      `Missing durationSec for step title=${args.step.title ?? '(none)'}`
    );
  }

  const base: Record<string, unknown> = {
    ...args.template,
    output: {
      width: args.program.output.width,
      height: args.program.output.height,
      fps: args.program.output.fps,
      durationSec: finalDurationSec,
      padBeforeSec: (args.template as Record<string, unknown> & {output?: {padBeforeSec?: number}}).output?.padBeforeSec ?? 0,
      padAfterSec: (args.template as Record<string, unknown> & {output?: {padAfterSec?: number}}).output?.padAfterSec ?? 0,
    },
  };

  base.theme = mergeTheme(
    (args.program.themeDefaults ?? {}) as Record<string, unknown>,
    base.theme as Record<string, unknown> | undefined
  );
  base.theme = mergeTheme(
    base.theme as Record<string, unknown>,
    args.step.theme
  );

  const timer = base.timer as Record<string, unknown>;
  base.timer = {
    ...timer,
    ...(args.step.title ? {title: args.step.title} : {}),
    ...(args.step.title2 ? {title2: args.step.title2} : {}),
  };

  const output = base.output as Record<string, unknown>;
  if (typeof args.step.padBeforeSec === 'number') output.padBeforeSec = args.step.padBeforeSec;
  if (typeof args.step.padAfterSec === 'number') output.padAfterSec = args.step.padAfterSec;

  base.events = [...((base.events as RawEvent[]) ?? []), ...(args.step.events ?? [])];

  if (args.program.speechDefaults) {
    base.speech = {...(base.speech as Record<string, unknown>), ...args.program.speechDefaults};
  }

  return RawSpecSchema.parse(base) as RawTimerSpec;
}

async function resolveAudioForTimer(args: {
  raw: RawTimerSpec;
  segmentStartSec: number;
  ttsResolver?: TtsResolver;
  assetDict: Record<string, string>;
}): Promise<ResolvedAudioClip[]> {
  const audio: ResolvedAudioClip[] = [];

  const timerAtSec = (ev: RawEvent) =>
    'atSec' in ev ? ev.atSec : args.raw.output.durationSec - ev.fromEndSec;

  for (let i = 0; i < args.raw.events.length; i++) {
    const ev = args.raw.events[i];
    const localSec = timerAtSec(ev) + args.raw.output.padBeforeSec;
    const globalSec = args.segmentStartSec + localSec;

    if (ev.type === 'tts' && args.ttsResolver) {
      const model = ev.model ?? args.raw.speech.model;
      const voice = ev.voice ?? args.raw.speech.voice;
      const instructions = args.raw.speech.instructions;
      const src = await args.ttsResolver({text: ev.text, model, voice, instructions});
      audio.push({
        id: `tts-${globalSec}-${i}`,
        atSec: globalSec,
        src,
      });
    }

    if (ev.type === 'chime') {
      audio.push({
        id: `chime-${globalSec}-${i}`,
        atSec: globalSec,
        src: `assets/${args.raw.assets.chime}`,
      });
    }

    if (ev.type === 'asset') {
      const fileName = args.assetDict[ev.tag];
      if (!fileName) {
        throw new Error(`Unknown asset tag: ${ev.tag}`);
      }
      audio.push({
        id: `asset-${globalSec}-${i}`,
        atSec: globalSec,
        src: `assets/${fileName}`,
      });
    }
  }

  return audio;
}

async function resolveAudioForTransition(args: {
  transition: { durationSec: number; events?: RawEvent[] };
  segmentStartSec: number;
  program: ProgramSpec;
  ttsResolver?: TtsResolver;
  assetDict: Record<string, string>;
}): Promise<ResolvedAudioClip[]> {
  const audio: ResolvedAudioClip[] = [];

  const fallbackSpeech = RawSpecSchema.parse({
    output: {durationSec: 1},
    theme: {},
    timer: {},
  }).speech;
  const speech = args.program.speechDefaults ?? fallbackSpeech;

  const fallbackAssets = RawSpecSchema.parse({
    output: {durationSec: 1},
    theme: {},
    timer: {},
  }).assets;

  const transitionAtSec = (ev: RawEvent) =>
    'atSec' in ev ? ev.atSec : args.transition.durationSec - ev.fromEndSec;

  const events = args.transition.events ?? [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const globalSec = args.segmentStartSec + transitionAtSec(ev);

    if (ev.type === 'tts' && args.ttsResolver) {
      const model = ev.model ?? speech.model;
      const voice = ev.voice ?? speech.voice;
      const instructions = speech.instructions;
      const src = await args.ttsResolver({text: ev.text, model, voice, instructions});
      audio.push({
        id: `transition-tts-${globalSec}-${i}`,
        atSec: globalSec,
        src,
      });
    }

    if (ev.type === 'chime') {
      audio.push({
        id: `transition-chime-${globalSec}-${i}`,
        atSec: globalSec,
        src: `assets/${fallbackAssets.chime}`,
      });
    }

    if (ev.type === 'asset') {
      const fileName = args.assetDict[ev.tag];
      if (!fileName) {
        throw new Error(`Unknown asset tag: ${ev.tag}`);
      }
      audio.push({
        id: `transition-asset-${globalSec}-${i}`,
        atSec: globalSec,
        src: `assets/${fileName}`,
      });
    }
  }

  return audio;
}

export async function resolveProgramSpec(args: {
  spec: ProgramSpec;
  ttsResolver?: TtsResolver;
  assetDict?: Record<string, string>;
}): Promise<ResolvedProgramSpec> {
  const program = args.spec;
  const assetDict = args.assetDict ?? {};

  // Merge built-in templates with any inline timers
  const timers: Record<string, ProgramTimerTemplate> = {
    ...BUILT_IN_TEMPLATES,
    ...(program.timers ?? {}),
  };

  const segments: ResolvedProgramSpec['segments'] = [];
  const audio: ResolvedAudioClip[] = [];

  type Step = ProgramSpec['steps'][number];
  type TransitionStep = Extract<Step, {type: 'transition'}>;
  const isTransitionStep = (s: Step): s is TransitionStep => (s as Record<string, unknown>).type === 'transition';

  let cursorSec = 0;
  for (let i = 0; i < program.steps.length; i++) {
    const step = program.steps[i];

    if (isTransitionStep(step)) {
      const transition: ResolvedTransitionSpec = {
        output: {
          width: program.output.width,
          height: program.output.height,
          fps: program.output.fps,
          durationSec: step.durationSec,
        },
        theme: mergeTheme(
          (program.themeDefaults ?? {}) as Record<string, unknown>,
          step.theme as Record<string, unknown> | undefined
        ) as ResolvedTransitionSpec['theme'],
        transition: {
          text: step.text,
          text2: step.text2,
        },
      };

      segments.push({id: `step-${i}-transition`, type: 'transition', startSec: cursorSec, transition});

      audio.push(
        ...(await resolveAudioForTransition({
          transition: {durationSec: step.durationSec, events: step.events},
          segmentStartSec: cursorSec,
          program,
          ttsResolver: args.ttsResolver,
          assetDict,
        }))
      );

      cursorSec += step.durationSec;
      continue;
    }

    // Timer step
    const timerStep = step as Exclude<Step, TransitionStep>;
    const template = timers[(timerStep as Record<string, unknown>).use as string];
    if (!template) {
      throw new Error(`Unknown timer template: ${(timerStep as Record<string, unknown>).use}`);
    }

    const raw = mergeTimerTemplate({
      program,
      template,
      step: {
        title: (timerStep as Record<string, unknown>).title as string | undefined,
        title2: (timerStep as Record<string, unknown>).title2 as string | undefined,
        durationSec: (timerStep as Record<string, unknown>).durationSec as number | undefined,
        padBeforeSec: (timerStep as Record<string, unknown>).padBeforeSec as number | undefined,
        padAfterSec: (timerStep as Record<string, unknown>).padAfterSec as number | undefined,
        theme: (timerStep as Record<string, unknown>).theme as Record<string, unknown> | undefined,
        events: (timerStep as Record<string, unknown>).events as RawEvent[] | undefined,
      },
    });

    const resolvedTimer: ResolvedTimerSpec = {
      output: raw.output,
      theme: raw.theme,
      timer: raw.timer,
      audio: [],
    };

    segments.push({id: `step-${i}-${(timerStep as Record<string, unknown>).use}`, type: 'timer', startSec: cursorSec, timer: resolvedTimer});

    const segAudio = await resolveAudioForTimer({
      raw,
      segmentStartSec: cursorSec,
      ttsResolver: args.ttsResolver,
      assetDict,
    });
    audio.push(...segAudio);

    const segLenSec = raw.output.durationSec + raw.output.padBeforeSec + raw.output.padAfterSec;
    cursorSec += segLenSec;
  }

  // Program-level events
  const fallbackSpeech = RawSpecSchema.parse({output: {durationSec: 1}, theme: {}, timer: {}}).speech;
  const speech = program.speechDefaults ?? fallbackSpeech;
  const fallbackAssets = RawSpecSchema.parse({output: {durationSec: 1}, theme: {}, timer: {}}).assets;

  for (const ev of program.events ?? []) {
    const globalSec = ev.atSec;
    if (ev.type === 'tts' && args.ttsResolver) {
      const model = ev.model ?? speech.model;
      const voice = ev.voice ?? speech.voice;
      const src = await args.ttsResolver({text: ev.text, model, voice, instructions: speech.instructions});
      audio.push({id: `program-tts-${globalSec}`, atSec: globalSec, src});
    }
    if (ev.type === 'chime') {
      audio.push({id: `program-chime-${globalSec}`, atSec: globalSec, src: `assets/${fallbackAssets.chime}`});
    }
  }

  const totalDurationSec = Math.max(program.totalDurationSec ?? 0, cursorSec);

  return {
    output: {
      width: program.output.width,
      height: program.output.height,
      fps: program.output.fps,
      totalDurationSec,
    },
    segments,
    audio,
  };
}

/** Parse a YAML string into a ProgramSpec */
export function parseProgramYaml(yamlText: string): ProgramSpec {
  // Dynamic import avoided - caller should pass parsed object
  throw new Error('Use parseProgramJson instead, or call the /api/resolve endpoint');
}

/** Parse a JSON object into a validated ProgramSpec */
export function parseProgramJson(data: unknown): ProgramSpec {
  return ProgramSpecSchema.parse(data);
}
