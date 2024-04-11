import { Producer } from "../composables/use-tracking-pipeline";

function listen(target: EventTarget, eventName: string, handler: (event: Event) => void) {
  target.addEventListener(eventName, handler);
  return () => {
    target.removeEventListener(eventName, handler);
  };
}

export const ClickProducer: Producer = ({ document, push }) => {
  return listen(document, 'click', push);
};

export const MouseMoveProducer: Producer = ({ document, push }) => {
  return listen(document.defaultView as Window, 'mousemove', push);
};

export const DOMProducer: Producer = ({ document, push }) => {
  // TODO: serialize(ctx.document);

  const mutationObserver = new MutationObserver((event) => {
    // TODO: of course we will have to serialize this shit
    push(event);
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

export const InputProducer: Producer = ({ document, push }) => {
  return listen(document, 'change', push);
};
