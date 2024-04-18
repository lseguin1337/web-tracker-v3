import { useTrackerConfig } from "../composables/use-tracker-config";
import { consumer, EventHook, useTrackingPipeline } from "../composables/use-tracking-pipeline";

import { RecordingDOMConfig, RecordingDOMProducer } from "../producers/dom";
import { InputChangeProducer } from "../producers/inputs";
import { ClickProducer, MouseMoveProducer } from "../producers/pointers";
import { SerializedEvent } from "../producers/types";

// All producers used by the SR Module
const producers = [
  ClickProducer,
  InputChangeProducer,
  MouseMoveProducer,
  RecordingDOMProducer,
];

// recording events consumer
function consume(push: EventHook<SerializedEvent>) {
  return consumer<SerializedEvent>(producers, () => push);
}

export function RecordingModule() {
  if (__DEBUG__) console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  // declare a context pipeline (this will be use inside the RecordedDOMProducer)
  pipeline.define(RecordingDOMConfig, { anonymized: !!config.anonymization });

  // register all producers/composers the recording module is using
  pipeline.use(...producers);

  // consume recording events
  pipeline.use(consume((event) => {
    // TODO: batch and submit events
    if (__DEBUG__) console.log('RecordingEvent', event);
  }));
}
