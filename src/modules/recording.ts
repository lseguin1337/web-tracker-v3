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

// recording events consumer
function consume(push: EventHook<SerializedEvent>) {
  return consumer<SerializedEvent>(producers, () => push);
}

export function RecordingModule() {
  if (__DEBUG__) console.log('RecordingModule init');
  const config = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  // declare a context pipeline (this will be use inside the RecordedDOMProducer)
  pipeline.define(AnonymizedContext, !!config.anonymization);

  // register all producers/composers the recording module is using
  pipeline.use(...producers);

  // consume recording events
  pipeline.use(consume((event) => {
    // TODO: batch and submit events
    if (__DEBUG__) console.log('RecordingEvent', event);
  }));
}
