import { useTrackerConfig } from "../composables/use-tracker-config";
import { useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputProducer, MouseMoveProducer } from "../producers";
import { DOMAnonymizer } from "../transformers";

export function RecordingModule() {
  console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.register([
    ClickProducer,
    InputProducer,
    MouseMoveProducer,
    DOMProducer,
  ]);

  if (config.anonymization)
    pipeline.register([DOMAnonymizer]);
}
