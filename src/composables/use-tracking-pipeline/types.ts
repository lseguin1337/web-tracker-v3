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
  use: (...producers: PipelineInjectable[]) => void;

  /**
   * @description Supsend producer activity
   * @returns Restore producer activity
   */
  suspend: (producers: Producer<any>[]) => (() => {});
}

export type PipelineOptions = Partial<Omit<PipelineContext, 'onStop'>>;

export interface Producer<Out> {
  type: 'producer';
  setup: ProducerSetup<Out>;
}

export interface Transformer<In, Out> {
  type: 'transformer';
  deps: Source<In>[];
  setup: TransformerSetup<In, Out>
}

export interface Composer<In, Out> {
  type: 'composer';
  deps: Source<In>[];
  setup: ComposerSetup<In, Out>;
}

export interface Consumer<In> {
  type: 'consumer';
  deps: Source<In>[];
  setup: ConsumerSetup<In>;
}

export type Source<Out = unknown> = Producer<Out> | Composer<any, Out>;
export type PipelineInjectable = Producer<any> | Composer<any, any> | Transformer<any, any> | Consumer<any>;

export type ProducerSetup<Out> = (ctx: PipelineContext, push: EventHook<Out>) => UnsubscribeHook;
export type TransformerSetup<In, Out> = (ctx: PipelineContext, push: EventHook<Out>) => EventHook<In>;
export type ComposerSetup<In, Out> = (ctx: PipelineContext, push: EventHook<Out>) => EventHook<In>;
export type ConsumerSetup<In> = (ctx: PipelineContext) => EventHook<In>;
