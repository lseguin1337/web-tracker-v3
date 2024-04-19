import { provideTrackerConfig, TagConfig } from "@/composables/use-tracker-config";
import { createTrackingPipeline, EventHook, Source } from "@/composables/use-tracking-pipeline";
import * as Pipeline from "@/composables/use-tracking-pipeline/pipeline";
import { contextHelper } from "@/lib/testing";

const originalCreatePipeline = Pipeline.createPipeline;

// this can be moved into the utils
export function setupPipeline(win = window) {
  const pipeline = originalCreatePipeline();

  jest.spyOn(pipeline, 'define');
  jest.spyOn(pipeline, 'start');
  jest.spyOn(pipeline, 'stop');
  jest.spyOn(pipeline, 'suspend');
  jest.spyOn(pipeline, 'use');

  jest.spyOn(Pipeline, 'createPipeline').mockReturnValueOnce(pipeline);

  createTrackingPipeline({ window: win });

  const resolve = <T>(producer: Source<T>) => {
    return jest.mocked(pipeline.use).mock.calls.filter((args) => args[0].includes(producer)).map(args => args[1] as EventHook<T>);
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
    return setupPipeline();
  });
}
