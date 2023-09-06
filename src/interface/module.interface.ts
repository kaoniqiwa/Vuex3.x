import { ActionPayload, ActionTree } from "./action.interface";
import { CommitOptions } from "./commit.interface";
import { DispatchOptions } from "./dispatch.interface";
import { GetterTree } from "./getter.interface";
import { MutationTree } from "./mutation.interface";

export interface ModuleOptions<
  S = Record<string, any>,
  R = Record<string, any>
> {
  namespaced?: boolean;
  state?: S | (() => S);
  getters?: GetterTree<S, R>;
  actions?: ActionTree<S, R>;
  mutations?: MutationTree<S>;
  modules?: ModuleTree<R>;
}

export interface ModuleTree<R> {
  [key: string]: ModuleOptions<any, R>;
}

export interface RegisterModuleOptions {
  /**动态注册的模块的状态不会覆盖全局状态 */
  preserveState?: boolean;
}

export interface ModuleContext {
  dispatch: (
    _type: string | ActionPayload,
    _payload?: any,
    _options?: DispatchOptions
  ) => Promise<unknown> | undefined;
  commit: (_type: string, _payload: any, _options: CommitOptions) => void;
  getters: () => Record<string, any>;
  state: () => Record<string, any>;
}
