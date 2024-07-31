import { Context, FnHook, ModuleContext, ModuleFn, ModuleFnOutput, ModuleInstance } from "./types";

let current: ModuleContext | null = null;

function getCurrentContext() {
  if (!current) throw new Error('context not available');
  return current;
}

export function provide<T>(token: Context<T>, value: T) {
  const { providers } = getCurrentContext();
  providers.set(token, value);
}

export function inject<T>(token: Context<T>): T {
  const { parent } = getCurrentContext();
  for (let ctx = parent; ctx; ctx = ctx.parent) {
    if (ctx.providers.has(token))
      return ctx.providers.get(token) as T;
  }
  throw new Error('injectable is not available');
}

export function createContext<T>() {
  return Symbol() as unknown as Context<T>;
}

/**
 * @description useCallback is an utils that will restore the original context before calling the function
 */
function useCallback<T extends (...args: any[]) => unknown>(fn: T): T {
  const savedContext = getCurrentContext();
  return ((...args) => {
    const old = current;
    current = savedContext;
    try {
      return fn(...args);
    } finally {
      current = old;
    }
  }) as T;
}

function callEvery(hooks: FnHook[]) {
  for (const hook of hooks)
    hook();
}

export function useAsyncMount() {
  return useCallback(mount);
}

/**
 * @description Wrap a child module to mount or destroy it on demand
 * it can also be use to access to the child instance
 */
export function useModule(Child: ModuleFn, isActive = true) {
  let update: (() => void) | undefined;
  let instance: ModuleInstance | undefined;

  function ChildProxy() {
    const mountChild = useAsyncMount();
    update = () => {
      if (isActive) {
        instance = instance || mountChild(Child);
      } else {
        instance?.destroy();
        instance = undefined;
      }
    };
    onDestroy(() => {
      update = undefined;
      instance = undefined;
    });
    return [update];
  }

  Object.defineProperty(ChildProxy, 'instance', {
    get() {
      return instance;
    },
  });

  ChildProxy.destroy = () => {
    if (!isActive) return;
    isActive = false;
    update?.();
  };

  ChildProxy.mount = () => {
    if (isActive) return;
    isActive = true;
    update?.();
  };

  ChildProxy.toggle = () => {
    isActive = !isActive;
    update?.();
  };

  ChildProxy.reload = () => {
    // force the reloading of the module
    ChildProxy.destroy();
    ChildProxy.mount();
  };

  ChildProxy.isMounted = () => {
    return isActive;
  };

  return ChildProxy;
}

function mountChildren(children: ModuleFnOutput): ModuleInstance[] {
  if (!children) return [];
  return (Array.isArray(children) ? children : [children]).map(mount);
}

/**
 * @description module life cycle on mounted
 */
export function onMounted(fn: FnHook) {
  const { hooks: { mount } } = getCurrentContext();
  mount.push(fn);
}

/**
 * @description module life cycle on destroy
 */
export function onDestroy(fn: FnHook) {
  const { hooks: { destroy } } = getCurrentContext();
  destroy.push(fn);
}

function createModuleInstance(ctx: ModuleContext) {
  const moduleInstance: ModuleInstance = {
    destroy() {
      const children = ctx.children;  
      ctx.children = [];
      const destroy = ctx.hooks.destroy;
      ctx.hooks.destroy = [];

      callEvery(destroy);
      for (const child of children)
        child.destroy();

      // remove self ref from parent children list
      const index = ctx.parent?.children.indexOf(moduleInstance) || -1;
      if (index > -1)
        ctx.parent?.children.splice(index, 1);
    },
  };
  Object.setPrototypeOf(moduleInstance, ctx.exposed);
  ctx.parent?.children.push(moduleInstance);
  mountChildren(ctx.moduleFn());
  callEvery(ctx.hooks.mount);
  return moduleInstance;
}

/**
 * @description expose methods to the parent
 */
export function expose(methods: Record<string, (...args: any[]) => any>) {
  const { exposed } = getCurrentContext();
  Object.assign(exposed, methods);
}

export function mount(moduleFn: ModuleFn): ModuleInstance {
  current = {
    moduleFn,
    parent: current,
    hooks: { mount: [], destroy: [] },
    providers: new Map(),
    children: [],
    exposed: {},
  };
  try {
    return createModuleInstance(current);
  } finally {
    current = current.parent; // restore context;
  }
}

export const NoopModule: ModuleFn = () => [];
