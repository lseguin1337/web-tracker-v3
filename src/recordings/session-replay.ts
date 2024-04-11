import { useEventEmitter, useEventIdentifier, useEventTransformer } from "../composables/use-event";
import { useTrackingLifeCycle } from "../composables/use-tracking-life-cycle";

function MutationObserverModule() {
  const emit = useEventEmitter();
  const { onStart, onStop, onCommand } = useTrackingLifeCycle();
  let timer: any;

  onCommand('hello-world', () => {
    console.log('coucou')
  });

  onStart(() => {
    console.log('TRACKING STARTED');
    timer = setInterval(() => emit({ type: 'mutation',  data: Math.random() }), 1000);
  });

  onStop(() => {
    console.log('STOP TRACKING');
    clearInterval(timer);
  });
}

export function SessionReplayModule() {
  const getNextId = useEventIdentifier();
  // this will apply some tranformation to any child module emitting an event
  useEventTransformer((event) => ({ ...event, date: Date.now(), id: getNextId() }));

  return [
    MutationObserverModule,
  ];
}