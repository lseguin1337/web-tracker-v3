import { provideTrackerConfig, TagConfig } from "@/composables/use-tracker-config";
import { createTrackingPipeline, EventHook, Source } from "@/composables/use-tracking-pipeline";
import * as Pipeline from "@/composables/use-tracking-pipeline/pipeline";
import { onDestroy } from "@/lib";
import { contextHelper } from "@/lib/testing";

const originalCreatePipeline = Pipeline.createPipeline;

function once(fn: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    fn();
  };
}

export function setupPipeline(win = window) {
  const pipeline = originalCreatePipeline();

  jest.spyOn(pipeline, 'define');
  jest.spyOn(pipeline, 'start');
  jest.spyOn(pipeline, 'stop');
  jest.spyOn(pipeline, 'suspend');
  jest.spyOn(pipeline, 'use');

  jest.spyOn(Pipeline, 'createPipeline').mockReturnValueOnce(pipeline);

  createTrackingPipeline({ window: win });

  const destroy: (() => void)[] = [];

  onDestroy(() => {
    for (const hook of destroy)
      hook();
  });

  const stop = once(() => pipeline.stop());

  return {
    mockProducer<T>(producer: Source<T>) {
      let push: EventHook<T>;
      const input = jest.fn();
      const setupMock = jest.spyOn(producer, 'setup').mockImplementation((next) => {
        push = next;
        return input;
      });
      destroy.push(() => setupMock.mockRestore());
      return {
        setupMock,
        get isUsed() {
          return !!push;
        },
        get emit() {
          if (!push) throw new Error('Pipeline not started');
          return push;
        },
        input,
      };
    },
    startPipeline() {
      pipeline.start();
      destroy.push(stop);
    },
    stopPipeline: stop,
  };
}

export function fakeTrackerContext(config: Partial<TagConfig> = {}, win = window) {
  return contextHelper(() => {
    provideTrackerConfig({ tagVersion: 'test', ...config });
    return setupPipeline(win);
  });
}
