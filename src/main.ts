import { mount, NoopModule, onDestroy, onMounted } from './lib';

import { provideTrackerConfig, TagConfig } from './composables/use-tracker-config';
import { createTrackingPipeline } from './composables/use-tracking-pipeline';

import { RecordingModule } from './modules/recording';
import { AnalyticsModule } from './modules/analytics';

function WebTracker(config: TagConfig) {
  // expose context to sub modules
  const pipeline = createTrackingPipeline();
  provideTrackerConfig(config);

  onMounted(() => {
    // call when all sub module are mounted...
    if (__DEV__) console.log('Pipeline starting...');
    pipeline.start();
  });

  onDestroy(() => {
    // call when ModuleInstance is destroyed
    pipeline.stop();
  });

  return [
    AnalyticsModule,
    config.sessionRecordingEnabled ? RecordingModule : NoopModule,
    // ... we can use any other sub module
  ];
}

async function bootstrap() {
  const tracker = await mount(() => WebTracker({
    sessionRecordingEnabled: true,
    anonymization: true,
    textVisibility: false,
    heatmap: true,
    tagVersion: 'demo'
  }));
  if (__DEV__) console.log(tracker);
}

bootstrap();