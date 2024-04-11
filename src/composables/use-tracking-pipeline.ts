import { createContext, inject, provide } from "../lib";

export type EventHook<T = unknown> = (event: T) => void

type UnsubscribeHook = () => void;

export interface PipelineContext<T> {
  push: EventHook<T>;
  document: Document;
}

// TODO: typings
export type Producer<T = unknown> = (ctx: PipelineContext<T>) => UnsubscribeHook;

export type Transformer<T = unknown, U = unknown> = (ctx: PipelineContext<T>) => EventHook<U>;

export type Composer<T = unknown, U = unknown> = (ctx: PipelineContext<T>) => EventHook<U>;

interface TrackingPipeline {
  register: (producers: Producer[]) => void;
  transform: (producer: Producer, transform: Transformer) => void;
  compose: (sources: Producer[], composer: Composer) => void;
}

const TrackingPipelineContext = createContext<TrackingPipeline>();

export function createTrackingPipeline() {
  const producers = new Set();
  const transformers = new Map();

  provide(TrackingPipelineContext, {
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
    start: () => {
      // TODO: should be implemented
    },
    stop: () => {
      // TODO: should be implemented
    },
  };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}
