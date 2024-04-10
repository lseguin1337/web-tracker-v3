import { createContext, inject, provide } from "../lib";

type Hook = (() => void);
type Unsubscribe = (() => void);

export interface LifeCycle {
  onStart(hook: Hook): Hook;
  onStop(hook: Hook): Hook;
}

export const TrackingLifeCycle = createContext<LifeCycle>();

function callEvery(hooks: Hook[]) {
  for (const hook of hooks)
    hook();
}

function subscriber(hooks: Hook[] = []) {
  return {
    on: (hook: Hook): Unsubscribe => {
      hooks.push(hook);
      return () => {
        const index = hooks.indexOf(hook);
        hooks.splice(index, 1);
      };
    },
    emit: () => callEvery(hooks),
  };
};

export function setupTrackingLifeCycle() {
  const { on: onStart, emit: start } = subscriber();
  const { on: onStop, emit: stop } = subscriber();
  provide(TrackingLifeCycle,  {
    onStart,
    onStop,
  });
  return { start, stop };
}

export function useTrackingLifeCycle() {
  return inject(TrackingLifeCycle);
}