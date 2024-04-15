import { composer, producer, useDocument, useWindow } from "../composables/use-tracking-pipeline";
import { listen } from "./listen";
import { SerializedEvent } from "./types";

export const ClickProducer = producer<SerializedEvent<'click'>>((push) => {
  if (__DEBUG__) console.log('ClickProducer init');
  return listen(useDocument(), 'click', push);
});

export const MouseMoveProducer = producer<SerializedEvent<'mousemove'>>((push) => {
  if (__DEBUG__) console.log('MouseMoveProducer init');
  return listen(useWindow(), 'mousemove', push);
});

export const ThrottledMouseMoveProducer = composer<SerializedEvent<'mousemove'>, SerializedEvent<'mousemove'>>([MouseMoveProducer], (push) => {
  if (__DEBUG__) console.log('ThrottledMouseMoveProducer init');
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (event) => {
    if (timer === null) {
      timer = setTimeout(() => (timer = null), 400);
      push(event);
    }
  };
});
