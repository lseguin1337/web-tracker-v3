import { mount } from "./context";
import { ModuleFn, ModuleInstance } from "./types";

/**
 * @description testing helper to setup a context of a module
 */
export function contextHelper<T extends Record<string, unknown>>(setup: () => T) {
  let isUsed = false;
  let providers: T | undefined;
  let instance: ModuleInstance | undefined;
  return new Proxy({
    $mount: async (...modules: ModuleFn[]) => {
      if (isUsed) throw new Error('count be mounted twice');
      isUsed = true;
      instance = await mount(() => {
        providers = setup();
        return modules;
      });
      return instance;
    },
    $destroy: () => {
      isUsed = false;
      instance?.destroy();
      providers = undefined;
      instance = undefined;
    },
  }, {
    get(target, key) {
      if (key === '$mount') return target[key];
      if (!instance) throw new Error('module not mounted');
      if (key === '$destroy') return target[key];
      if (key === '$instance') return instance;
      return (providers as any)[key];
    }
  }) as unknown as T & { $mount: (...modules: ModuleFn[]) => Promise<ModuleInstance>, $destroy: () => void, $instance: ModuleInstance };
}