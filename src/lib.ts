// context.ts
let current: ModuleContext | null = null;
let ctxId = 0;

interface ModuleContext {
  parent: null | ModuleContext;
  hooks: {
    mount: FnHook[];
    destroy: FnHook[];
  },
  providers: Map<String, unknown>;
}

export type Context<T> = String & { __: T };

type ModuleFnOutput = void | ModuleFn | ModuleFn[] | Promise<void | ModuleFn | ModuleFn[]>;
export type ModuleFn = () => ModuleFnOutput;

interface ModuleInstance {
  destroy(): void;
}

type FnHook = () => void;

function throwErrorContext(): never {
  throw new Error('used outside a context')
}

export function provide<T>(token: Context<T>, value: T) {
  if (!current) throwErrorContext();
  current.providers.set(token, value);
}

export function inject<T>(token: Context<T>): T {
  if (!current) throwErrorContext();
  for (let ctx = current.parent; ctx; ctx = ctx.parent) {
    if (ctx.providers.has(token))
      return ctx.providers.get(token) as T;
  }
  throw new Error('context not available');
}

export function createContext<T>(name: string = `context_${ctxId++}`) {
  return String(name) as unknown as Context<T>;
}

function isPromise(value: unknown): value is Promise<unknown> {
  return !!value && typeof value === 'object' && 'then' in value;
}

function restoreCtx<T extends (...args: any[]) => unknown>(fn: T): T {
  const savedContext = current;
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

async function mountChildren(children: ModuleFnOutput): Promise<ModuleInstance[]> {
  if (!children) return Promise.resolve([]);
  if (isPromise(children)) return children.then(restoreCtx(mountChildren));
  return Promise.all((Array.isArray(children) ? children : [children]).map(mount));
}

export function onMounted(fn: FnHook) {
  if (!current) throwErrorContext();
  current.hooks.mount.push(fn);
}

export function onDestroy(fn: FnHook) {
  if (!current) throwErrorContext();
  current.hooks.destroy.push(fn);
}

export function mount(moduleFn: ModuleFn): Promise<ModuleInstance> {
  const localContext: ModuleContext = {
    parent: current,
    hooks: { mount: [], destroy: [] },
    providers: new Map()
  };
  current = localContext;
  try {
    return mountChildren(moduleFn()).then((children) => {
      // this is out of the context
      callEvery(localContext.hooks.mount);
      // return ModuleInstance
      return {
        destroy() {
          callEvery(localContext.hooks.destroy);
          for (const child of children)
            child.destroy();
        }
      };
    });
  } finally {
    current = current.parent; // restore context;
  }
}

// utils only for testing
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
