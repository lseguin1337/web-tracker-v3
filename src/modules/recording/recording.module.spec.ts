import { createPipeline } from "@/composables/use-tracking-pipeline/pipeline";
import { contextHelper } from "@/lib/testing";
import { RecordingModule } from "./recording.module";
import { provideTrackerConfig } from "@/composables/use-tracker-config";
import { createTrackingPipeline, EventHook, Source } from "@/composables/use-tracking-pipeline";
import { ClickProducer, MouseMoveProducer } from "@/producers/pointers";
import { RecordingDOMProducer } from "@/producers/dom";

const eventDisptacher = jest.fn();

// mock the recording dispatcher
jest.mock('./use-recording-dispatcher', () => ({
  useRecordingDispatcher: jest.fn().mockImplementation(() => eventDisptacher),
}));

// mock the pipeline
jest.mock('@/composables/use-tracking-pipeline/pipeline');

// this can be moved into the utils
function setupFakePipeline() {
  const pipeline = {
    start: jest.fn(),
    stop: jest.fn(),
    define: jest.fn(),
    suspend: jest.fn(),
    use: jest.fn(),
  };
  jest.mocked(createPipeline).mockReturnValue(pipeline);
  createTrackingPipeline({ window });
  
  const resolve = <T>(producer: Source<T>) => {
    return pipeline.use.mock.calls.filter((args) => args[0].includes(producer)).map(args => args[1] as EventHook<T>);
  };

  return {
    pipeline,
    hasProducerRegistered(producer: Source<any>) {
      return resolve(producer).length > 0;
    },
    dispatcher<T>(producer: Source<T>) {
      const subscribers = resolve(producer);
      if (subscribers.length === 0) throw new Error('No Dispatcher available');
      return (event: T) => {
        for (const emit of subscribers) emit(event);
      };
    }
  };
}

const ctx = contextHelper(() => {
  provideTrackerConfig({ tagVersion: 'test', anonymization: true });
  return setupFakePipeline();
});

describe('RecordingModule', () => {
  beforeEach(async () => await ctx.$mount(RecordingModule));
  afterEach(() => ctx.$destroy());

  it('should register MouseMoveProducer and forward event to the dispatcher', () => {
    expect(ctx.pipeline.use).toHaveBeenCalledTimes(1);
    expect(ctx.hasProducerRegistered(MouseMoveProducer)).toBe(true);
    ctx.dispatcher(MouseMoveProducer)({ type: 'mousemove', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'mousemove', args: [] });
  });

  it('should register RecordingDOMProducer and forward event to the dispatcher', () => {
    expect(ctx.pipeline.use).toHaveBeenCalledTimes(1);
    expect(ctx.hasProducerRegistered(RecordingDOMProducer)).toBe(true);
    ctx.dispatcher(RecordingDOMProducer)({ type: 'initialDom', args: [{ blbal: '' }] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'initialDom', args: [{ blbal: '' }] });
  });

  it('should register ClickProducer and forward event to the dispatcher', () => {
    expect(ctx.pipeline.use).toHaveBeenCalledTimes(1);
    expect(ctx.hasProducerRegistered(ClickProducer)).toBe(true);
    ctx.dispatcher(ClickProducer)({ type: 'click', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'click', args: [] });
  });
});