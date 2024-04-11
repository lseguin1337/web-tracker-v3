import { mount, onDestroy, onMounted } from './lib';

import { provideTrackerConfig, TagConfig } from './composables/use-tracker-config';
import { RecordingModule } from './modules/recording';
import { createTrackingPipeline } from './composables/use-tracking-pipeline';
import { AnalyticsModule } from './modules/analytics';

function WebTracker(config: TagConfig) {
  // expose context to sub modules
  const pipeline = createTrackingPipeline();
  provideTrackerConfig(config);

  onMounted(() => {
    // call when all sub module are mounted...
    pipeline.start(console.log);
  });

  onDestroy(() => {
    // call when ModuleInstance is destroyed
    pipeline.stop();
  });

  return [
    AnalyticsModule,
    ...(config.sessionRecordingEnabled ? [RecordingModule] : []),
    // ... we can use any other sub module
  ];
}

async function bootstrap() {
  await mount(() => WebTracker({
    sessionRecordingEnabled: true,
    anonymization: true,
    tagVersion: 'demo'
  }));
}

bootstrap();