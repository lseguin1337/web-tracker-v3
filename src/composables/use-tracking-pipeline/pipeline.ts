import { EventHook, PipelineContext, Composer, ComposerSetup, Consumer, ConsumerSetup, PipelineInjectable, Producer, ProducerSetup, Source, UnsubscribeHook, PipelineContextKey } from "./types";

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

/**
 * Rescheduler is a function to avoid main thread blocking
 */
function createRescheduler() {
  let refDate: number | null = null;
  let rescheduledTasks: (() => void)[] = [];
  let countSyncHook = 0;

  const reschedule = () => {
    countSyncHook = 0;
    refDate = null;
    const tasks = rescheduledTasks;
    rescheduledTasks = [];
    for (const task of tasks) task();
  };

  return function outputHandler(...hooks: EventHook<unknown>[]) {
    if (hooks.length === 1 && '_is_rescheduler' in hooks[0]) {
      // simple optimisation to avoid rescheduling 2 times the same task
      return hooks[0];
    }

    // optimization to avoid useless looping if there is only one item
    const disptach = hooks.length === 1 ? hooks[0] : ((event: unknown) => {
      for (const hook of hooks)
        hook(event);
    });

    function push(event: unknown) {
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

      disptach(event);
    };

    push._is_rescheduler = true;

    return push as EventHook<unknown>;
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

/**
 * TODO: simplify this function
 */
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

  function internalUse(...items: (Source<any> | Consumer<any>)[]) {
    for (const item of items) {
      if (!registry.has(item)) {
        registry.add(item);
        // auto inject dependencies
        if (item.type === 'composer' || item.type === 'consumer')
          internalUse(...item.deps);
      }
    }
  }

  function use<T>(items: Source<T>[], emit: EventHook<T>) {
    internalUse(consumer(items, () => emit));
  }

  function start() {
    if (started) throwAlreadyStarted();
    const entries = Array.from(registry);
    const sources = entries;

    const dedup = createRescheduler();

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
      }).filter(instance => !!instance) as EventHook<any>[];

      if (next.length === 0) {
        console.warn('No consumer found for', source);
        inputs.set(source, null);
        // return noop entry
        throw new Error('No consumer');
      }

      const output = dedup(...next);

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