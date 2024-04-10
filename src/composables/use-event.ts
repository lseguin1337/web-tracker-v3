import { createContext, inject, provide } from "../lib";

export interface TrackingEvent {
  type: string;
  [key: string]: unknown;
}

const EventEmitter = createContext<(event: TrackingEvent) => void>();
const EventIdContext = createContext<{ currentEventId: number }>();

export function useEventEmitter() {
  return inject(EventEmitter);
}

export function useEventTransformer(map: (event: TrackingEvent) => TrackingEvent) {
  const emit = useEventEmitter();
  provide(EventEmitter, (childEvent) => emit(map(childEvent)));
}

export function provideEventEmitter(emit: (event: TrackingEvent) => void) {
  provide(EventEmitter, emit);
}

export function setupEventIdentifier() {
  provide(EventIdContext, { currentEventId: 1 });
}

export function useEventIdentifier() {
  const store = inject(EventIdContext);
  return () => store.currentEventId++;
}