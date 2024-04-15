import { EventHook, PipelineContext, Composer, ComposerSetup, Consumer, ConsumerSetup, PipelineInjectable, Producer, ProducerSetup, Source, Transformer, TransformerSetup, UnsubscribeHook, PipelineOptions } from "./types";

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
export function transformer<In, Out>(source: Source<In>, setup: TransformerSetup<In, Out>): Transformer<In, Out> {
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

export function createPipeline({ window: windowContext = window, ...options }: PipelineOptions = {}) {
  const registry = new Set<PipelineInjectable>();
  const stopListeners: (() => void)[] = [];
  const inputs = new Map<Source<any> | Consumer<any>, EventHook<any> | UnsubscribeHook>();
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

  function use(...items: (Source<any> | Transformer<any, any> | Consumer<any>)[]) {
    for (const item of items) {
      registry.add(item);
      // auto inject dependencies
      if (item.type === 'composer')
        use(...item.deps);
    }
  }

  function start() {
    if (started) throw new Error('Pieline already started');
    const entries = Array.from(registry);
    const sources = entries.filter(s => s.type !== 'transformer');
    const transformers = entries.filter(s => s.type === 'transformer');

    const dedup = createOutputsHandler();

    function resolve(source: Source<any> | Consumer<any>): EventHook<any> | (() => void) {
      if (inputs.has(source))
        return inputs.get(source)!;

      if (source.type === 'consumer') {
        const input = source.setup(context);
        inputs.set(source, input);
        return input;
      }

      const next = sources.filter(child => (child.type === 'composer' || child.type === 'consumer') && child.deps.includes(source)).map(resolve);
      if (next.length === 0) {
        console.warn('No consumer found for', source);
        // return noop entry
        const input = () => {};
        inputs.set(source, input);
        return input;
      }

      const output = transformers
        .filter(transformer => transformer.deps.includes(source))
        .reduceRight((push, { setup }) => setup(context, dedup(push)), dedup(...next));
      
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