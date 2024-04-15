import { mount, NoopModule, onDestroy, onMounted } from './lib';

import { provideTrackerConfig, TagConfig } from './composables/use-tracker-config';
import { createTrackingPipeline } from './composables/use-tracking-pipeline';

import { AnalyticsModule } from './modules/analytics';
import { RecordingModule } from './modules/recording';

function WebTracker(config: TagConfig) {
  if (__DEBUG__) console.time('WebTrackerInit');
  // expose context to sub modules
  const pipeline = createTrackingPipeline();
  provideTrackerConfig(config);

  onMounted(() => {
    // call when all sub module are mounted...
    if (__DEBUG__) console.log('Pipeline starting...');
    pipeline.start();
    // to measure the time to load the tag
    if (__DEBUG__) console.timeEnd('WebTrackerInit');
  });

  onDestroy(() => {
    // call when ModuleInstance is destroyed
    pipeline.stop();
  });

  return [
    AnalyticsModule,
    config.recording ? RecordingModule : NoopModule,
    // ... we can use any other sub module
  ];
}

async function bootstrap() {
  await mount(() => WebTracker({
    recording: false,
    anonymization: true,
    textVisibility: false,
    heatmap: true,
    tagVersion: 'demo'
  }));
}

bootstrap();