import { createContext, inject, provide } from "../lib";

type Hook = (() => void);
type Unsubscribe = (() => void);

export interface LifeCycle {
  onStart(hook: Hook): Unsubscribe;
  onStop(hook: Hook): Unsubscribe;
  onCommand(name: string, fn: (...args: unknown[]) => void): Unsubscribe;
}

export const TrackingLifeCycle = createContext<LifeCycle>();

function callEvery(hooks: Hook[], args: unknown[]) {
  for (const hook of hooks)
    (hook as any)(...args);
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
    emit: (...args: unknown[]) => callEvery(hooks, args),
  };
};

export function setupTrackingLifeCycle() {
  const commandListeners: Record<string, ReturnType<typeof subscriber>> = {};
  const { on: onStart, emit: start } = subscriber();
  const { on: onStop, emit: stop } = subscriber();

  provide(TrackingLifeCycle,  {
    onStart,
    onStop,
    onCommand(name: string, fn: (...args: unknown[]) => void) {
      if (!commandListeners[name])
        commandListeners[name] = subscriber();
      return commandListeners[name].on(fn);
    }
  });
  return {
    start,
    stop,
    sendCommand(name: string, ...args: unknown[]) {
      commandListeners[name]?.emit(...args);
    }
  }
}

export function useTrackingLifeCycle() {
  return inject(TrackingLifeCycle);
}