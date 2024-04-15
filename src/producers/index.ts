import { composer, producer } from "../composables/use-tracking-pipeline";

export interface SerializedEvent<T extends string = string> {
  type: T;
  args: any[];
}

function listen<T extends string>(target: EventTarget, eventName: T, push: (event: SerializedEvent<T>) => void) {
  const handler = (e: Event) => push({ type: eventName, args: [e] });
  target.addEventListener(eventName, handler, { capture: true });
  return () => target.removeEventListener(eventName, handler, { capture: true });
}

export const ClickProducer = producer<SerializedEvent<'click'>>(({ document }, push) => {
  if (__DEV__) console.log('ClickProducer init');
  return listen(document, 'click', push);
});

export const MouseMoveProducer = producer<SerializedEvent<'mousemove'>>(({ window }, push) => {
  if (__DEV__) console.log('MouseMoveProducer init');
  return listen(window, 'mousemove', push);
});

export const ThrottledMouseMoveProducer = composer<SerializedEvent<'mousemove'>, SerializedEvent<'mousemove'>>([MouseMoveProducer], (_, push) => {
  if (__DEV__) console.log('ThrottledMouseMoveProducer init');
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (event) => {
    if (timer === null) {
      timer = setTimeout(() => (timer = null), 400);
      push(event);
    }
  };
});

export const InputProducer = producer<SerializedEvent<'change'>>(({ document }, push) => {
  if (__DEV__)  console.log('InputProducer init');
  return listen(document, 'change', push);
});

export const DOMProducer = producer<SerializedEvent<'initialDom' | 'mutations'>>(({ document, window }, push) => {
  if (__DEV__)  console.log('DOMProducer init');
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
    if (__DEV__) console.log('DOMProducer destroyed');
    mutationObserver.disconnect();
  };
});

export const RageClickProducer = composer<SerializedEvent<'click'>, SerializedEvent<'rageClick'>>([ClickProducer], (_, push) => {
  if (__DEV__) console.log('RageClickProducer init');
  const dates: number[] = [];
  return (event) => {
    dates.push(event.args[0].timeStamp);
    if (dates.length > 3) dates.shift();
    if (dates.length === 3 && dates[2] - dates[0] < 300) {
      push({ type: 'rageClick', args: [] });
      dates.splice(0,3);
    }
  };
});

export const TextVisibilityProducer = composer<SerializedEvent, SerializedEvent<'textVisibility'>>([DOMProducer], (_, push) => {
  if (__DEV__) console.log('TextVisibilityProducer init');
  let i = 0;
  return (_) => {
    if (i++ % 2) push({ type: 'textVisibility', args: [] });
  };
});
