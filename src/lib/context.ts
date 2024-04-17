import { Context, FnHook, ModuleContext, ModuleFn, ModuleFnOutput, ModuleInstance } from "./types";

let current: ModuleContext | null = null;

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

export function createContext<T>() {
  return Symbol() as unknown as Context<T>;
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

export async function useAsyncChildren() {
  return restoreCtx((modules: ModuleFn[]) => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    mount(() => modules).then(({ destroy }) => {
      if (signal.aborted) return destroy();
      signal.onabort = destroy;
    });
    onDestroy(() => ctrl.abort());
  });
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

export const NoopModule: ModuleFn = () => [];
