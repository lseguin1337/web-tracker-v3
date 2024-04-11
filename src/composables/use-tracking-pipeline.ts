import { createContext, inject, provide } from "../lib";

export type EventHook<T = unknown> = (event: T) => void

type UnsubscribeHook = () => void;

export interface PipelineContext {
  document: Document;
  [key: symbol]: unknown;
}

// TODO: typings
export type Producer<T = unknown> = (ctx: PipelineContext, push: EventHook<T>) => UnsubscribeHook;

export type Transformer<T = unknown> = (ctx: PipelineContext, push: EventHook<T>) => EventHook<T>;

export type Composer<T = unknown, U = unknown> = (ctx: PipelineContext, push: EventHook<T>) => EventHook<U>;

interface TrackingPipeline {
  define: (key: Symbol, value: unknown) => void;
  register: (producers: Producer[]) => void;
  transform: (producer: Producer, transform: Transformer) => void;
  compose: (sources: Producer[], composer: Composer) => void;
}

const TrackingPipelineContext = createContext<TrackingPipeline>();

export function createTrackingPipeline({ document = window.document, ...options }: Partial<PipelineContext> = {}) {
  const producers = new Set<Producer>();
  const transformers = new Map<Producer, Set<Transformer>>();
  let onStop = () => {};

  const ctx: any = {
    document,
    ...options,
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
      const destroys = Array.from(producers).map((producer) => {
        const trans = Array.from(transformers.get(producer) || []);
        const next = trans.reduceRight((nextPush, transfomer) => transfomer(ctx, nextPush), push);
        return producer(ctx, next);
      });
      // TODO: we should implement the transformation layer + the composition layer
      onStop = () => destroys.map((kill) => kill());
    },
    stop: () => onStop(),
  };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}