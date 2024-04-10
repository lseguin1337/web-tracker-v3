import { mount, onDestroy, onMounted } from './lib';

import { setupTrackingLifeCycle } from './composables/use-tracking-life-cycle';
import { setupEventIdentifier, provideEventEmitter, TrackingEvent } from './composables/use-event';
import { provideDocument, provideTrackerConfig, TagConfig } from './composables/use-tracker-config';
import { SessionReplayModule } from './recordings/session-replay';

function setupTrackingContext(options: { document: Document, config: TagConfig, emit: (event: TrackingEvent) => void }) {
  setupEventIdentifier();
  provideTrackerConfig(options.config);
  provideEventEmitter(options.emit);
  provideDocument(options.document);
  return setupTrackingLifeCycle();
}

function WebTracker(document: Document) {
  // expose context to sub modules
  const lifeCycle = setupTrackingContext({
    document,
    config: { anonymization: false, tagVersion: 'demo' },
    emit: (event) => console.log('event:', event),
  });

  onMounted(() => {
    // call when all sub module are mounted...
    lifeCycle.start();
  });

  onDestroy(() => {
    // call when ModuleInstance is destroyed
    lifeCycle.stop();
  });

  return [
    SessionReplayModule,
    // ... we can use any other sub module
  ];
}

async function bootstrap() {
  const tracker = await mount(() => WebTracker(document));
  setTimeout(() => tracker.destroy(), 5000);
}

bootstrap();