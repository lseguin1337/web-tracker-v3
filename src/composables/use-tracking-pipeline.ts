import { createContext, inject, provide } from "../lib";

export type EventHook<T = unknown> = (event: T) => void

type UnsubscribeHook = () => void;

export interface PipelineContext {
  document: Document;
  window: Window & typeof globalThis;
  signal: AbortSignal;
  onStop: (handler: () => void) => void;
  [key: symbol]: unknown;
}

type PipelineOptions = Partial<Omit<PipelineContext, 'signal' | 'onStop'>>;

// TODO: typings
export type Producer<T = unknown> = (ctx: PipelineContext, push: EventHook<T>) => UnsubscribeHook;

export type Transformer<T = unknown> = (ctx: PipelineContext, push: EventHook<T>) => EventHook<T>;

export type Composer<T = unknown, U = unknown> = (ctx: PipelineContext, push: EventHook<T>) => EventHook<U>;

interface TrackingPipeline {
  /**
   * @description Define value into the pipeline context
   */
  define: (key: Symbol, value: unknown) => void;

  /**
   * @description Register producers into the tracking pipeline
   */
  register: (producers: Producer[]) => void;

  /**
   * @description Register a transformer for a producer
   */
  transform: (producer: Producer, transform: Transformer) => void;

  /**
   * @description Register a composer that will combine other producer to generate new event (RageClick, TextVisibility)
   */
  compose: (sources: Producer[], composer: Composer) => void;
}

const TrackingPipelineContext = createContext<TrackingPipeline>();

export function createTrackingPipeline({ window: windowContext = window, ...options }: PipelineOptions = {}) {
  const producers = new Set<Producer>();
  const transformers = new Map<Producer, Set<Transformer>>();
  const abortCtrl = new AbortController();
  const signal = abortCtrl.signal;

  const ctx: PipelineContext = {
    window: windowContext,
    document: options.document || windowContext.document,
    ...options,
    signal,
    onStop: (handler) => signal.addEventListener('abort', handler, { once: true }),
  };

  provide(TrackingPipelineContext, {
    define(key: symbol, value: any) {
      ctx[key] = value;
    },
    register(newProducers: Producer[]) {
      for (const producer of newProducers)
        producers.add(producer);
    },
    transform(producer: Producer, transformer: Transformer) {
      // transform an event
      const list = transformers.get(producer) || new Set();
      list.add(transformer);
      transformers.set(producer, list);
    },
    compose(sources: Producer[], composer: Composer) {
      // TODO: forward all events from the sources to the composer
    }
  });

  return {
    start: (push: EventHook) => {
      // TODO: we should implement the transformation layer + the composition layer
      const destroys = Array.from(producers).map((producer) => {
        const trans = Array.from(transformers.get(producer) || []);
        const next = trans.reduceRight((nextPush, transfomer) => transfomer(ctx, nextPush), push);
        return producer(ctx, next);
      });
      signal.addEventListener('abort', () => destroys.forEach(kill => kill()), { once: true });
    },
    stop: () => {
      abortCtrl.abort();
    }
  };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}