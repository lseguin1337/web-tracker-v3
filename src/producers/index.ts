import { Producer } from "../composables/use-tracking-pipeline";

function listen(target: EventTarget, eventName: string, push: (event: { type: string, args: [Event] }) => void) {
  const handler = (e: Event) => push({ type: eventName, args: [e] });
  target.addEventListener(eventName, handler);
  return () => target.removeEventListener(eventName, handler);
}

export const ClickProducer: Producer = ({ document, push }) => {
  console.log('ClickProducer init');
  return listen(document, 'click', push);
};

export const MouseMoveProducer: Producer = ({ document, push }) => {
  console.log('MouseMoveProducer init');
  return listen(document.defaultView as Window, 'mousemove', push);
};

export const InputProducer: Producer = ({ document, push }) => {
  console.log('InputProducer init');
  return listen(document, 'change', push);
};

export const DOMProducer: Producer = ({ document, push }) => {
  console.log('DOMProducer init');
  // todo serialze document
  push({ type: 'initialDom', args: [document] });

  const mutationObserver = new MutationObserver((mutations) => {
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
    mutationObserver.disconnect();
  };
};
