import { useTrackerConfig } from "../composables/use-tracker-config";
import { composer, consumer, createPipelineContext, usePipelineContext, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputChangeProducer, MouseMoveProducer, SerializedEvent } from "../producers";

const AnonymizedContext = createPipelineContext<boolean>();

const RecordedDOMProducer = composer<SerializedEvent<'initialDom' | 'mutations'>, SerializedEvent<'initialDom' | 'mutations'> & { anonymized?: boolean }>([DOMProducer], (push) => {
  if (__DEBUG__) console.log('RecordedDOMProvider init');
  if (!usePipelineContext(AnonymizedContext)) return push;
  return (event) => {
    // TODO: anonymize event
    push({ ...event, anonymized: true });
  };
});

// All producers used by the SR Module
const producers = [
  ClickProducer,
  InputChangeProducer,
  MouseMoveProducer,
  RecordedDOMProducer,
];

// Recording Payloads
const RecordingUploader = consumer<SerializedEvent>(producers, () => {
  if (__DEBUG__) console.log('RecordingUploader init');
  return (event) => {
    // TODO: batch event and submit them using http
    if (__DEBUG__) console.log('RecordingEvent:', event);
  };
});

export function RecordingModule() {
  if (__DEBUG__) console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.define(AnonymizedContext, !!config.anonymization);
  pipeline.use(...producers, RecordingUploader);
}
