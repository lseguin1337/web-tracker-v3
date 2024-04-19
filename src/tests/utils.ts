import { provideTrackerConfig, TagConfig } from "@/composables/use-tracker-config";
import { createTrackingPipeline, EventHook, Source } from "@/composables/use-tracking-pipeline";
import { createPipeline } from "@/composables/use-tracking-pipeline/pipeline";
import { contextHelper } from "@/lib/testing";

// mock the pipeline
jest.mock('@/composables/use-tracking-pipeline/pipeline');

// this can be moved into the utils
export function setupFakePipeline(win = window) {
  const pipeline = {
    start: jest.fn(),
    stop: jest.fn(),
    define: jest.fn(),
    suspend: jest.fn(),
    use: jest.fn(),
  };
  jest.mocked(createPipeline).mockReturnValueOnce(pipeline);
  createTrackingPipeline({ window: win });

  const resolve = <T>(producer: Source<T>) => {
    return pipeline.use.mock.calls.filter((args) => args[0].includes(producer)).map(args => args[1] as EventHook<T>);
  };

  return {
    pipeline,
    hasProducerRegistered(producer: Source<any>) {
      return resolve(producer).length > 0;
    },
    fakeDispatcher<T>(producer: Source<T>) {
      const subscribers = resolve(producer);
      if (subscribers.length === 0) throw new Error('No Dispatcher available');
      return (event: T) => {
        for (const emit of subscribers) emit(event);
      };
    }
  };
}

export function fakeTrackingTagContext(config: Partial<TagConfig> = {}) {
  return contextHelper(() => {
    provideTrackerConfig({ tagVersion: 'test', ...config });
    return setupFakePipeline();
  });
}
