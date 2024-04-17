import { useTrackerConfig } from "../composables/use-tracker-config";
import { composer, consumer, createPipelineContext, EventHook, EventOf, usePipelineContext, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer, InputChangeProducer, MouseMoveProducer, SerializedEvent } from "../producers";

const AnonymizedContext = createPipelineContext<boolean>();

type AnonymizedDOMEvent = EventOf<typeof DOMProducer> & { anonymized?: boolean };

const RecordedDOMProducer = composer([DOMProducer], (push: EventHook<AnonymizedDOMEvent>) => {
  if (__DEBUG__) console.log('RecordedDOMProvider init');
  const isAnonymized = usePipelineContext(AnonymizedContext);
  if (!isAnonymized)
    return push;
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

  // declare a context pipeline (this will be use inside the RecordedDOMProducer)
  pipeline.define(AnonymizedContext, !!config.anonymization);

  // register all producers/composers/consumer the recording module is using
  pipeline.use(...producers, RecordingUploader);
}
