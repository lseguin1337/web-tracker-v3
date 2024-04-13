import { producer } from "../composables/use-tracking-pipeline";

interface SerializedEvent {
  type: string;
  args: any[];
}

function listen(target: EventTarget, eventName: string, push: (event: SerializedEvent) => void) {
  const handler = (e: Event) => push({ type: eventName, args: [e] });
  target.addEventListener(eventName, handler);
  return () => target.removeEventListener(eventName, handler);
}

export const ClickProducer = producer<SerializedEvent>(({ document }, push) => {
  console.log('ClickProducer init');
  return listen(document, 'click', push);
});

export const MouseMoveProducer = producer<SerializedEvent>(({ window }, push) => {
  console.log('MouseMoveProducer init');
  return listen(window, 'mousemove', push);
});

export const InputProducer = producer<SerializedEvent>(({ document }, push) => {
  console.log('InputProducer init');
  return listen(document, 'change', push);
});

export const DOMProducer = producer<SerializedEvent>(({ document, window }, push) => {
  console.log('DOMProducer init');
  // todo serialze document
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
    console.log('DOMProducer destroyed');
    mutationObserver.disconnect();
  };
});
