import { EventHook, PipelineContext, Composer, ComposerSetup, Consumer, ConsumerSetup, PipelineInjectable, Producer, ProducerSetup, Source, Transformer, TransformerSetup, UnsubscribeHook, PipelineContextKey } from "./types";

let current: PipelineContext | null = null;

/**
 * @description Emit events
 */
export function producer<Out>(setup: ProducerSetup<Out>): Producer<Out> {
  return {
    type: 'producer',
    setup,
  };
}

/**
 * @description Transform a Producer/Composer behavior
 */
export function transformer<In, Out = In>(source: Source<In>, setup: TransformerSetup<In, Out>): Transformer<In, Out> {
  return {
    type: 'transformer',
    deps: [source],
    setup,
  };
}

/**
 * @description Combine events to generate new ones
 */
export function composer<In, Out>(sources: Source<In>[], setup: ComposerSetup<In, Out>): Composer<In, Out> {
  return {
    type: 'composer',
    deps: sources,
    setup,
  };
}

/**
 * @description Consume events
 */
export function consumer<In>(sources: Source<In>[], setup: ConsumerSetup<In>): Consumer<In> {
  return {
    type: 'consumer',
    deps: sources,
    setup,
  };
}

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
        if (__DEBUG__) console.log('Pipeline re-scheduled');
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

export function createPipelineContext<T = unknown>() {
  return Symbol() as unknown as PipelineContextKey<T>;
}

function throwContextNotAvailable(): never {
  throw new Error('Pipeline context not available')
}

export function usePipelineContext<T>(key: PipelineContextKey<T>): T {
  if (!current) throwContextNotAvailable();
  return current.get(key);
}

export function onStop(fn: () => void) {
  if (!current) throwContextNotAvailable();
  return current.onStop(fn);
}

export function createPipeline() {
  const registry = new Set<PipelineInjectable>();
  const stopListeners: (() => void)[] = [];
  const inputs = new Map<Source<any> | Consumer<any>, EventHook<any> | UnsubscribeHook | null>();
  const outputs = new Map<Source<any>, EventHook<any>>();
  const defined = new Map<PipelineContextKey<unknown>, unknown>();

  let started = false;

  const context: PipelineContext = {
    onStop: (handler) => stopListeners.push(handler),
    get: <T>(key: PipelineContextKey<T>) => defined.get(key) as T,
  };

  function throwAlreadyStarted(): never {
    throw new Error('Pipeline already started');
  }

  function throwNotStarted(): never {
    throw new Error('Pipeline not started yet');
  }

  function define<T>(key: PipelineContextKey<T>, value: T) {
    if (started) throwAlreadyStarted();
    defined.set(key, value);
  }

  function useContext(fn: () => void) {
    const old = current;
    current = context;
    fn();
    current = old;
  }

  function suspend(...producers: Producer<any>[]) {
    if (!started) throwNotStarted();
    const suspended = producers.map((producer) => {
      (inputs.get(producer) as UnsubscribeHook)();
      return () => producer.setup(outputs.get(producer)!);
    });
    return () => {
      useContext(() => suspended.forEach(restore => restore()));
    };
  }

  function use(...items: (Source<any> | Transformer<any, any> | Consumer<any>)[]) {
    for (const item of items) {
      registry.add(item);
      // auto inject dependencies
      if (item.type === 'composer')
        use(...item.deps);
    }
  }

  function start() {
    if (started) throwAlreadyStarted();
    const entries = Array.from(registry);
    const sources = entries.filter(s => s.type !== 'transformer');
    const transformers = entries.filter(s => s.type === 'transformer');

    const dedup = createOutputsHandler();

    function resolve(source: Source<any> | Consumer<any>): EventHook<any> | (() => void) {
      if (inputs.has(source)) {
        const instance = inputs.get(source);
        if (!instance) throw new Error('No consumer');
        return instance;
      }

      if (source.type === 'consumer') {
        const input = source.setup();
        inputs.set(source, input);
        return input;
      }

      const next = sources.filter(child => (child.type === 'composer' || child.type === 'consumer') && child.deps.includes(source)).map((source) => {
        try {
          return resolve(source);
        } catch {
          return null;
        }
      }).filter(instance => !!instance);

      if (next.length === 0) {
        console.warn('No consumer found for', source);
        inputs.set(source, null);
        // return noop entry
        throw new Error('No consumer');
      }

      const output = transformers
        .filter(transformer => transformer.deps.includes(source))
        .reduceRight((push, { setup }) => setup(dedup(push)), dedup(...next));

      const input = source.setup(output);
      outputs.set(source, output);
      inputs.set(source, input);
      return input;
    }
    useContext(() => sources.map(resolve));
    started = true;
  }

  function stop() {
    if (!started) throwNotStarted();
    for (const [item, stop] of inputs)
      if (item.type === 'producer') (stop as UnsubscribeHook)();
    inputs.clear();
    outputs.clear();
    while (stopListeners.length)
      stopListeners.pop()!();
    started = false;
  }

  return {
    start,
    stop,
    define,
    use,
    suspend,
  };
}