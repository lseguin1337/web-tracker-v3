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

export function producer<T>(setup: ProducerFn<T>): Producer<T> {
  return {
    type: 'producer',
    setup,
  };
}

export function transformer<T, U>(source: Source<T>, setup: TransformerFn<T, U>): Transformer<T, U> {
  return {
    type: 'transformer',
    deps: [source],
    setup,
  };
}

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
  register: (producers: (Source<any> | Transformer<any, any>)[]) => void;
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
  const instances = new Map<Source<any>, EventHook<any> | UnsubscribeHook>();

  const context: PipelineContext = {
    window: windowContext,
    document: options.document || windowContext.document,
    ...options,
    onStop: (handler) => stopListeners.push(handler),
  };

  provide(TrackingPipelineContext, {
    define(key: symbol, value: any) {
      context[key] = value;
    },
    register(items: (Source<any> | Transformer<any, any>)[]) {
      for (const item of items)
        registry.add(item);
    },
  });

  return {
    start(push: (event: any) => void) {
      const entries = Array.from(registry);
      const sources = entries.filter(s => s.type !== 'transformer');
      const transformers = entries.filter(s => s.type === 'transformer');

      const dedup = createOutputsHandler();

      function resolve(source: Source<any>): EventHook<any> | (() => void) {
        if (instances.has(source))
          return instances.get(source)!;
        const composers = sources.filter(child => child.type === 'composer' && child.deps.includes(source)).map(resolve);
        const output = transformers
          .filter(transformer => transformer.deps.includes(source))
          .reduceRight((push, { setup }) => setup(context, dedup(push)), dedup(...composers, push));
        const instance = source.setup(context, output);
        instances.set(source, instance);
        return instance;
      }

      sources.map(resolve);
    },
    stop: () => {
      for (const [item, stop] of instances) {
        if (item.type === 'producer') (stop as UnsubscribeHook)();
        instances.delete(item);
      }
      while (stopListeners.length)
        stopListeners.pop()!();
    }
  };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}