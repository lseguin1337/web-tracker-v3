export interface ModuleContext {
  parent: null | ModuleContext;
  hooks: {
    mount: FnHook[];
    destroy: FnHook[];
  },
  providers: Map<Context<unknown>, unknown>;
}

export type Context<T> = Symbol & { _: T };

export type ModuleFnOutput = void | ModuleFn | ModuleFn[] | Promise<void | ModuleFn | ModuleFn[]>;
export type ModuleFn = () => ModuleFnOutput;

export interface ModuleInstance {
  destroy(): void;
}

export type FnHook = () => void;