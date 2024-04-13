import { createContext, inject, provide } from "../lib";

export type EventHook<T = unknown> = (event: T) => void

type UnsubscribeHook = () => void;

export interface PipelineContext {
  document: Document;
  window: Window & typeof globalThis;
  onStop: (handler: () => void) => void;
  [key: symbol]: unknown;
}

type PipelineOptions = Partial<Omit<PipelineContext, 'signal' | 'onStop'>>;

interface Producer<T> {
  type: 'producer';
  setup: ProducerFn<T>;
}

interface Transformer<T, U> {
  type: 'transformer';
  deps: Source<T>[];
  setup: TransformerFn<T, U>
}

interface Composer<T, U> {
  type: 'composer';
  deps: Source<T>[];
  setup: ComposerFn<T, U>;
}

type Source<T = unknown> = Producer<T> | Composer<any, T>;

type ProducerFn<T> = (ctx: PipelineContext, push: EventHook<T>) => UnsubscribeHook;
type TransformerFn<T, U> = (ctx: PipelineContext, push: EventHook<U>) => ((event: T) => void);
type ComposerFn<T, U> = (ctx: PipelineContext, push: EventHook<U>) => ((event: T) => void);

/**
 * @description Events Producer
 */
export function producer<T>(setup: ProducerFn<T>): Producer<T> {
  return {
    type: 'producer',
    setup,
  };
}

/**
 * @description Transform a Producer/Composer behavior
 */
export function transformer<T, U>(source: Source<T>, setup: TransformerFn<T, U>): Transformer<T, U> {
  return {
    type: 'transformer',
    deps: [source],
    setup,
  };
}

/**
 * @description Generate new Event From other 
 */
export function composer<T, U>(sources: Source<T>[], setup: ComposerFn<T, U>): Composer<T, U> {
  return {
    type: 'composer',
    deps: sources,
    setup,
  };
}

interface TrackingPipeline {
  /**
   * @description Define value into the pipeline context
   */
  define: (key: Symbol, value: unknown) => void;

  /**
   * @description Register producers into the tracking pipeline
   */
  use: (producers: (Source<any> | Transformer<any, any>)[]) => void;

  /**
   * @description Supsend producer activity
   * @returns Restore producer activity
   */
  suspend: (producers: Producer<any>[]) => (() => {});
}

const TrackingPipelineContext = createContext<TrackingPipeline>();

function createOutputsHandler() {
  let refDate: number | null = null;
  let rescheduledTasks: (() => void)[] = [];
  let countSyncHook = 0;

  const reschedule = () => {
    refDate = null;
    const tasks = rescheduledTasks;
    rescheduledTasks = [];
    for (const task of tasks) task();
  };

  return function outputHandler(...hooks: EventHook<unknown>[]) {
    return function push(event: unknown) {
      // handle non blocking thread
      if (refDate === null) {
        refDate = Date.now();
        setTimeout(reschedule, 0);
      }

      if (rescheduledTasks.length > 0 || (countSyncHook % 5 === 0 && Date.now() - refDate > 30)) {
        console.log('Pipeline re-scheduled');
        // reschedule forwarding
        rescheduledTasks.push(() => push(event));
        return;
      }

      countSyncHook++;

      // forward events
      for (const hook of hooks)
        hook(event);
    };
  }
}

export function createTrackingPipeline({ window: windowContext = window, ...options }: PipelineOptions = {}) {
  const registry = new Set<Source<any> | Transformer<any, any>>();
  const stopListeners: (() => void)[] = [];
  const inputs = new Map<Source<any>, EventHook<any> | UnsubscribeHook>();
  const outputs = new Map<Source<any>, EventHook<any>>();

  let started = false;

  const context: PipelineContext = {
    window: windowContext,
    document: options.document || windowContext.document,
    ...options,
    onStop: (handler) => stopListeners.push(handler),
    // TODO: should we expose suspend here?
  };

  function define(key: symbol, value: any) {
    context[key] = value;
  }

  function suspend(producers: Producer<any>[]) {
    if (!started) throw new Error('Pipeline not started: suspend is not available');
    const suspended = producers.map((producer) => {
      (inputs.get(producer) as UnsubscribeHook)();
      return () => producer.setup(context, outputs.get(producer)!);
    });
    return () => {
      for (const restore of suspended) restore();
    };
  }

  function use(items: (Source<any> | Transformer<any, any>)[]) {
    for (const item of items) {
      registry.add(item);
      // auto inject dependencies
      if (item.type === 'composer')
        use(item.deps);
    }
  }

  provide(TrackingPipelineContext, {
    define,
    use,
    suspend,
  } as TrackingPipeline);

  function start(push: (event: any) => void) {
    if (started) throw new Error('Pieline already started');
    const entries = Array.from(registry);
    const sources = entries.filter(s => s.type !== 'transformer');
    const transformers = entries.filter(s => s.type === 'transformer');

    const dedup = createOutputsHandler();

    function resolve(source: Source<any>): EventHook<any> | (() => void) {
      if (inputs.has(source))
        return inputs.get(source)!;
      const composers = sources.filter(child => child.type === 'composer' && child.deps.includes(source)).map(resolve);
      const output = transformers
        .filter(transformer => transformer.deps.includes(source))
        .reduceRight((push, { setup }) => setup(context, dedup(push)), dedup(...composers, push));
      const input = source.setup(context, output);
      outputs.set(source, output);
      inputs.set(source, input);
      return input;
    }
    sources.map(resolve);
    started = true;
  }

  function stop() {
    if (!started) throw new Error('Pipeline not started');
    for (const [item, stop] of inputs) {
      if (item.type === 'producer') (stop as UnsubscribeHook)();
      inputs.delete(item);
      outputs.delete(item);
    }
    while (stopListeners.length)
      stopListeners.pop()!();
    started = false;
  }

  return {
    start,
    stop,
  };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}