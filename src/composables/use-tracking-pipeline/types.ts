export type EventHook<T = unknown> = (event: T) => void

export type UnsubscribeHook = () => void;

export interface PipelineContext {
  document: Document;
  window: Window & typeof globalThis;
  onStop: (handler: () => void) => void;
  [key: symbol]: unknown;
}

export interface TrackingPipeline {
  /**
   * @description Define value into the pipeline context
   */
  define: (key: Symbol, value: unknown) => void;

  /**
   * @description Register producers into the tracking pipeline
   */
  use: (producers: PipelineInjectable[]) => void;

  /**
   * @description Supsend producer activity
   * @returns Restore producer activity
   */
  suspend: (producers: Producer<any>[]) => (() => {});
}

export type PipelineOptions = Partial<Omit<PipelineContext, 'onStop'>>;

export interface Producer<T> {
  type: 'producer';
  setup: ProducerSetup<T>;
}

export interface Transformer<T, U> {
  type: 'transformer';
  deps: Source<T>[];
  setup: TransformerSetup<T, U>
}

export interface Composer<T, U> {
  type: 'composer';
  deps: Source<T>[];
  setup: ComposerSetup<T, U>;
}

export interface Consumer<T> {
  type: 'consumer';
  deps: Source<T>[];
  setup: ConsumerSetup<T>;
}

export type Source<T = unknown> = Producer<T> | Composer<any, T>;
export type PipelineInjectable = Producer<any> | Composer<any, any> | Transformer<any, any> | Consumer<any>;

export type ProducerSetup<T> = (ctx: PipelineContext, push: EventHook<T>) => UnsubscribeHook;
export type TransformerSetup<T, U> = (ctx: PipelineContext, push: EventHook<U>) => EventHook<T>;
export type ComposerSetup<T, U> = (ctx: PipelineContext, push: EventHook<U>) => EventHook<T>;
export type ConsumerSetup<T> = (ctx: PipelineContext) => EventHook<T>;
