import { composer, createPipelineContext, EventHook, EventOf, producer, useDocument, usePipelineContext, useWindow } from "../composables/use-tracking-pipeline";
import { SerializedEvent } from "./types";

export const RecordingDOMConfig = createPipelineContext<{ anonymized: boolean }>();

type AnonymizedDOMEvent = EventOf<typeof DOMProducer> & { anonymized?: boolean };

export const DOMProducer = producer<SerializedEvent<'initialDom' | 'mutations'>>((push) => {
  if (__DEBUG__)  console.log('DOMProducer init');
  const window = useWindow();
  const document = useDocument();
  // TODO: serialze document
  push({ type: 'initialDom', args: [document] });

  // TODO: handle shadow root, adoptedStylesheets
  const mutationObserver = new window.MutationObserver((mutations) => {
    // TODO: of course we will have to serialize this shit
    push({ type: 'mutations', args: [mutations] });
  });

  mutationObserver.observe(document, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });

  return () => {
    if (__DEBUG__) console.log('DOMProducer destroyed');
    mutationObserver.disconnect();
  };
});

export const RecordingDOMProducer = composer([DOMProducer], (push: EventHook<AnonymizedDOMEvent>) => {
  if (__DEBUG__) console.log('RecordedDOMProvider init');
  const config = usePipelineContext(RecordingDOMConfig);
  if (!config.anonymized)
    return push;
  return (event) => {
    // TODO: anonymize event
    push({ ...event, anonymized: true });
  };
});

export const TextVisibilityProducer = composer<SerializedEvent, SerializedEvent<'textVisibility'>>([DOMProducer], (push) => {
  if (__DEBUG__) console.log('TextVisibilityProducer init');
  let i = 0;
  return (_) => {
    if (i++ % 2) push({ type: 'textVisibility', args: [] });
  };
});