export interface ModuleContext {
  moduleFn: ModuleFn,
  parent: null | ModuleContext;
  hooks: {
    mount: FnHook[];
    destroy: FnHook[];
  },
  providers: Map<Context<unknown>, unknown>;
  children: ModuleInstance[];
  exposed: Record<string, (...args: any[]) => any>;
}

export type Context<T> = Symbol & { _: T };

export type ModuleFnOutput = void | ModuleFn | ModuleFn[];
export type ModuleFn = () => ModuleFnOutput;

export interface ModuleInstance {
  destroy(): void;
}

export type FnHook = () => void;