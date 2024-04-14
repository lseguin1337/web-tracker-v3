import { useTrackerConfig } from "../composables/use-tracker-config";
import { consumer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputProducer, MouseMoveProducer } from "../producers";
import { DOMAnonymizer } from "../transformers";

const producers = [
  ClickProducer,
  InputProducer,
  MouseMoveProducer,
  DOMProducer,
];

const RecordingUploader = consumer(producers, () => {
  return (event) => {
    // TODO: batch event and submit them using http
    console.log('Recording Event:', event);
  };
});

export function RecordingModule() {
  console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.use(...producers, RecordingUploader);

  if (config.anonymization)
    pipeline.use(DOMAnonymizer);
}
