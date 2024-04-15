import { SerializedEvent } from "./types";

export function listen<T extends string>(target: EventTarget, eventName: T, push: (event: SerializedEvent<T>) => void) {
  const handler = (e: Event) => push({ type: eventName, args: [e] });
  target.addEventListener(eventName, handler, { capture: true });
  return () => target.removeEventListener(eventName, handler, { capture: true });
}
