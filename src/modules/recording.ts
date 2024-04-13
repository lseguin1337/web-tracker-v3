import { useTrackerConfig } from "../composables/use-tracker-config";
import { composer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputProducer, MouseMoveProducer } from "../producers";
import { DOMAnonymizer } from "../transformers";

const recordingProducers = [
  ClickProducer,
  InputProducer,
  MouseMoveProducer,
  DOMProducer,
];

const RecordingUploader = composer(recordingProducers, () => {
  let timer: any = null;
  let batch: any[] = [];

  function submit() {
    console.log('HTTP post', batch);
    batch = [];
  }

  return (event) => {
    batch.push(event);
    if (timer === null) {
      timer = setTimeout(() => {
        // submit payload after 1 second even if not full
        batch.length && submit();
        timer = null;
      }, 1000);
    }
    // submit payload when reaching 50 events
    if (batch.length === 50) submit();
  };
});

export function RecordingModule() {
  console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.use([...recordingProducers, RecordingUploader]);

  if (config.anonymization)
    pipeline.use([DOMAnonymizer]);
}
