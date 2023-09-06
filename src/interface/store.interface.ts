import { ActionTree } from "./action.interface";
import { GetterTree } from "./getter.interface";
import { ModuleOptions, ModuleTree } from "./module.interface";
import { MutationTree } from "./mutation.interface";
import { Store } from "../store";

export interface StoreOptions<S = Record<string, any>> {
  state?: S | (() => S);
  getters?: GetterTree<S, S>;
  actions?: ActionTree<S, S>;
  mutations?: MutationTree<S>;
  modules?: ModuleTree<S>;
  devtools?: boolean;
  strict?: boolean;
  plugins?: Plugin[];
}

export interface FuncType<T = any> {
  (...args: any[]): T;
}
export interface ObjectType {
  [key: string]: any;
}
export interface ObjectFuncType {
  [key: string]: FuncType;
}
export interface Payload {
  type: string;
}

export type Plugin = (store: Store) => any;

export interface SubscribeOptions {
  prepend?: boolean;
}

export type HotUpdateOptions = ModuleOptions;
