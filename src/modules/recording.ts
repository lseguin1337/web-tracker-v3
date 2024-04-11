import { useTrackerConfig } from "../composables/use-tracker-config";
import { useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputProducer } from "../producers";
import { AnonymizerTransformer } from "../transformers";

export function RecordingModule() {
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.register([
    ClickProducer,
    InputProducer,
    DOMProducer,
  ]);

  if (config.anonymization)
    pipeline.transform(DOMProducer, AnonymizerTransformer);
}
