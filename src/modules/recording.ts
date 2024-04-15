import { useTrackerConfig } from "../composables/use-tracker-config";
import { consumer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputProducer, MouseMoveProducer, SerializedEvent } from "../producers";
import { DOMAnonymizer } from "../transformers";

// All producers used by the SR Module
const producers = [
  ClickProducer,
  InputProducer,
  MouseMoveProducer,
  DOMProducer,
];

// Recording Payloads
const RecordingUploader = consumer<SerializedEvent>(producers, () => {
  if (__DEBUG__) console.log('RecordingUploader init');
  return (event) => {
    // TODO: batch event and submit them using http
    if (__DEBUG__) console.log(' RecordingEvent:', event);
  };
});

export function RecordingModule() {
  if (__DEBUG__) console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.use(...producers, RecordingUploader);

  if (config.anonymization)
    pipeline.use(DOMAnonymizer);
}
