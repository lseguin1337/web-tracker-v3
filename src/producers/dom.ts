import { composer, producer, useDocument, useWindow } from "../composables/use-tracking-pipeline";
import { SerializedEvent } from "./types";

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

export const TextVisibilityProducer = composer<SerializedEvent, SerializedEvent<'textVisibility'>>([DOMProducer], (push) => {
  if (__DEBUG__) console.log('TextVisibilityProducer init');
  let i = 0;
  return (_) => {
    if (i++ % 2) push({ type: 'textVisibility', args: [] });
  };
});
