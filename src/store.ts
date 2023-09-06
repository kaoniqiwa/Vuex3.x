import {
  FuncType,
  HotUpdateOptions,
  StoreOptions,
  SubscribeOptions,
} from "./interface/store.interface";
import { __DEV__, assert, unifyObjectStyle } from "./util";
import ModuleCollection from "./module/module-collection";
import Module from "./module/module";
import { CommitOptions } from "./interface/commit.interface";
import {
  ModuleOptions,
  RegisterModuleOptions,
} from "./interface/module.interface";
import { getNestedState, installModule } from "./install-module";
import { Vue, install } from "./install";
import { genericSubscribe } from "./subscribe";
import { resetStore, resetStoreVM } from "./reset";
import { Component, WatchOptions } from "./@types/vue";
import { DispatchOptions } from "./interface/dispatch.interface";
import {
  ActionPayload,
  ActionSubscriber,
  ActionSubscribersObject,
} from "./interface/action.interface";
import {
  MutationSubscriber,
  MutationPayload,
} from "./interface/mutation.interface";

export class Store {
  _vm?: Component;

  _committing: boolean;

  /** 使 Vuex store 进入严格模式，在严格模式下，任何 mutation 处理函数以外修改 Vuex state 都会抛出错误。*/
  strict: boolean;

  /** 默认收集所有模块的 mutation ,组成数组形式,可以定义相同名称的 mutation,后者覆盖前者 */
  _mutations: Record<string, FuncType[]>;

  /** 默认收集所有模块的 action ,组成数组形式,可以定义相同名称的 action,后者覆盖前者 */
  _actions: Record<string, FuncType<Promise<any>>[]>;

  /** 默认收集所有模块的 getter,组成数组形式,但不能有相同的 getter */
  _wrappedGetters: Record<string, any>;

  _subscribers: Array<MutationSubscriber>;
  _actionSubscribers: Array<ActionSubscribersObject>;

  _makeLocalGettersCache: Record<string, any>;
  _modulesNamespaceMap: Record<string, Module>;
  getters: Record<string, any>;

  _modules: ModuleCollection;

  _watcherVM: Component;

  constructor(options: StoreOptions) {
    /*
      在浏览器环境下，如果插件还未安装（!Vue即判断是否未安装），则它会自动安装。
      它允许用户在某些情况下避免自动安装。
    */
    if (!Vue && typeof window != undefined && window.Vue) {
      install(window.Vue);
    }

    if (__DEV__) {
      /** 如果是浏览器环境, 会执行 install,Vue一定有值，如果 Vue 没有值，则为开发环境，且未 Vue.use()*/
      assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`);
      assert(
        typeof Promise !== "undefined",
        `vuex requires a Promise polyfill in this browser.`
      );
      assert(
        this instanceof Store,
        `Store must be called with the new operator.`
      );
    }
    const { plugins = [], strict = false } = options;
    this.strict = strict;
    this._committing = false;

    this._mutations = Object.create(null);
    this._actions = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._makeLocalGettersCache = Object.create(null);
    this._modulesNamespaceMap = Object.create(null);
    this._subscribers = [];
    this._actionSubscribers = [];
    this._watcherVM = new Vue();

    this.getters = {};

    /* module收集器,将配置格式化为树状结构*/
    this._modules = new ModuleCollection(options);

    const store = this;

    /** 由于在外面会解构对象 {commit,dispatch} = vm.$store 导致 this 丢失,所以需要绑定 this 的指向 */
    const { dispatch, commit } = this;

    // 实例 commit
    this.commit = function (type, payload, options) {
      // 原型对象 commit
      return commit.call(store, type, payload, options);
    };
    this.dispatch = function (type, payload) {
      return dispatch.call(store, type, payload);
    };

    const state = this._modules.root.state;

    /** 从根模块开始，安装所有模块,收集 getters,actions,mutations */
    installModule(this, state, [], this._modules.root);

    // console.log(this._modules);
    /** 将状态放到 Vue 实例上 */
    resetStoreVM(this, state);

    plugins.forEach((plugin) => plugin(this));
  }
  /**
   *  需要进行数据劫持，所以 RootState应该放到 vue 实例上
   *  store.state == vm._data.$$state ==  store._modules.root.state
   */
  get state(): Record<string, any> {
    return this._vm ? this._vm._data.$$state : {};
  }
  /**
   * commit 中的更新必须为同步更新，更新后的状态会被 devtools 捕获
   * 如果是异步更新，devtool中的快照一直是更新前的快照,不方便调试
   */
  commit(
    _type: string | MutationPayload,
    _payload?: any,
    _options?: CommitOptions
  ) {
    const { type, payload, options } = unifyObjectStyle(
      _type,
      _payload,
      _options
    );
    // console.log(type, payload, options);
    const mutation = { type, payload };
    const entry = this._mutations[type];
    if (!entry) {
      if (__DEV__) {
        /** commit 一个不存在的 mutation */
        console.error(`[vuex] unknown mutation type: ${type}`);
      }
      return;
    }
    this._withCommit(() => {
      entry.forEach(function commitIterator(handler) {
        handler(_payload);
      });
    });
    /** mutation 更新完之后再通知订阅者, this.state 为最新状态 */
    this._subscribers.forEach((sub) => sub(mutation, this.state));
  }
  dispatch(
    _type: string | ActionPayload,
    _payload?: any,
    options?: DispatchOptions
  ) {
    const { type, payload } = unifyObjectStyle(_type, _payload);
    const action = { type, payload };
    const entry = this._actions[type];
    if (!entry) {
      if (__DEV__) {
        console.error(`[vuex] unknown action type: ${type}`);
      }
      return;
    }
    try {
      this._actionSubscribers
        .slice()
        .filter((sub) => sub.before)
        .forEach((sub) => {
          sub.before!(action, this.state);
        });
    } catch (e: any) {
      if (__DEV__) {
        console.warn(`[vuex] error in before action subscribers: `);
        console.error(e);
      }
    }
    /**
     *  单个 action 时，返回值 999
     *  多个 action 时，返回 [999,888]
     *  所以需要对 length 判断
     *
     */
    let result =
      entry.length > 1
        ? Promise.all(entry.map((handler) => handler(payload)))
        : entry[0](payload);

    return new Promise((resolve, reject) => {
      result.then(
        (res) => {
          try {
            this._actionSubscribers
              .filter((sub) => sub.after)
              .forEach((sub) => {
                sub.after!(action, this.state);
              });
          } catch (e: any) {
            if (__DEV__) {
              console.warn(`[vuex] error in after action subscribers: `);
              console.error(e);
            }
          }

          resolve(res);
        },
        (error) => {
          try {
            this._actionSubscribers
              .filter((sub) => sub.error)
              .forEach((sub) => {
                sub.error!(action, this.state, error);
              });
          } catch (e: any) {
            if (__DEV__) {
              console.warn(`[vuex] error in error action subscribers: `);
              console.error(e);
            }
          }
          reject(error);
        }
      );
    });
  }
  /**
   * 保证仅在 commit 中更改状态
   * @param fn
   */
  _withCommit(fn: FuncType) {
    const committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  }
  registerModule(
    path: string | string[],
    rawModule: ModuleOptions,
    options: RegisterModuleOptions = {}
  ) {
    if (typeof path === "string") path = [path];
    assert(Array.isArray(path), `module path must be a string or an Array.`);
    assert(
      path.length,
      "cannot register the root module by using registerModule."
    );
    this._modules.register(path, rawModule);

    installModule(
      this,
      this.state,
      path,
      this._modules.get(path),
      options.preserveState
    );

    resetStoreVM(this, this.state);
  }
  hasModule(path: string | string[]) {
    if (typeof path === "string") {
      path = [path];
    }
    if (__DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`);
    }

    // return !!this._modules.get(path);
    return this._modules.isRegistered(path);
  }
  unregisterModule(path: string | string[]) {
    if (typeof path === "string") {
      path = [path];
    }
    if (__DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`);
    }
    this._modules.unregister(path);
    this._withCommit(() => {
      const parentState = getNestedState(
        this.state,
        (path as Array<string>).slice(0, -1)
      );
      Vue.delete(parentState, path[path.length - 1]);
    });
    resetStore(this);
  }
  subscribe(
    fn: (mutation: MutationPayload, state: Record<string, any>) => any,
    options?: SubscribeOptions
  ) {
    return genericSubscribe(fn, this._subscribers, options);
  }
  subscribeAction(
    fn: ActionSubscriber | ActionSubscribersObject,
    options?: SubscribeOptions
  ) {
    const subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  }
  /** 比如状态持久化还原时调用 */
  replaceState(state: Record<string, any>) {
    this._withCommit(() => {
      if (this._vm) {
        this._vm._data.$$state = state;
      }
    });
  }
  watch<T = any>(
    getter: (state: Record<string, any>, getters: any) => T,
    cb: (value: T, oldValue: T) => void,
    options: WatchOptions
  ) {
    if (__DEV__) {
      assert(
        typeof getter === "function",
        `store.watch only accepts a function.`
      );
    }
    return this._watcherVM.$watch(
      () => getter(this.state, this.getters),
      cb,
      options
    );
  }

  hotUpdate(newOptions: HotUpdateOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  }
}
