import { CommitOptions } from "../interface/commit.interface";
import { ModuleContext, ModuleOptions } from "../interface/module.interface";
import { FuncType, HotUpdateOptions } from "../interface/store.interface";
import { forEachValue, isFunction } from "../util";

export default class Module {
  _rawModule: ModuleOptions;
  _children: Record<string, Module>;
  runtime: boolean;
  state: Record<string, any>;
  context!: ModuleContext;

  constructor(rawModule: ModuleOptions, runtime: boolean) {
    this.runtime = runtime;
    this._rawModule = rawModule;
    this._children = Object.create(null);

    const rawState = rawModule.state;
    /** 配置选项 store 为对象类型或者返回对象的函数 */
    this.state = isFunction(rawState) ? rawState() : rawState;
  }
  get namespaced() {
    return !!this._rawModule.namespaced;
  }
  addChild(key: string, module: Module) {
    Reflect.set(this._children, key, module);
  }
  getChild(key: string) {
    if (this.hasChild(key)) {
      return Reflect.get(this._children, key);
    } else {
      throw new Error(`Module ${key} is not found`);
    }
  }
  removeChild(key: string) {
    return Reflect.deleteProperty(this._children, key);
  }
  hasChild(key: string) {
    return Reflect.has(this._children, key);
  }

  forEachGetter(fn: FuncType) {
    this._rawModule.getters && forEachValue(this._rawModule.getters, fn);
  }
  forEachAction(fn: FuncType) {
    this._rawModule.actions && forEachValue(this._rawModule.actions, fn);
  }
  forEachMutation(fn: FuncType) {
    this._rawModule.mutations && forEachValue(this._rawModule.mutations, fn);
  }
  forEachChild<T, R>(fn: FuncType) {
    forEachValue(this._children, fn);
  }
  update(rawModule: HotUpdateOptions) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  }
}
