import { mount } from "./context";
import { ModuleFn, ModuleInstance } from "./types";

/**
 * @description testing helper to setup a context of a module
 */
export function contextHelper<T extends Record<string, unknown>>(setup: () => T) {
  let isUsed = false;
  let providers: T | undefined;
  let instance: ModuleInstance | undefined;

  const ctx = {
    /**
     * @description mount modules and use the setup function
     */
    $mount: async (...modules: ModuleFn[]) => {
      if (isUsed) throw new Error('count be mounted twice');
      isUsed = true;
      instance = await mount(() => {
        providers = setup();
        return modules;
      });
      return instance;
    },
    /**
     * @description destroy the module previously mounted
     */
    $destroy: () => {
      isUsed = false;
      instance?.destroy();
      providers = undefined;
      instance = undefined;
    },
    /**
     * @description derive the context to extend it
     */
    $: <U extends Record<string, unknown>>(secondSetup: () => U) => {
      return contextHelper(() => {
        return {
          ...setup(),
          ...secondSetup(),
        };
      });
    },
  };

  return new Proxy(ctx, {
    get(target, key) {
      if (key === '$mount') return target[key];
      if (key === '$') return target[key];
      if (!instance) throw new Error('module not mounted');
      if (key === '$destroy') return target[key];
      if (key === '$instance') return instance;
      return (providers as any)[key];
    }
  }) as unknown as T & typeof ctx;
}
