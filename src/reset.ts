import { Vue } from "./install";
import { installModule } from "./install-module";
import { Store } from "./store";
import { enableStrictMode } from "./strict";
import { forEachValue } from "./util";
/* 通过vm重设store，新建Vue对象使用Vue内部的响应式实现注册state以及computed */
export function resetStoreVM(
  store: Store,
  state: Record<string, any>,
  hot?: boolean
) {
  const oldVm = store._vm;

  /** store 收集所有 getters,包括子模块中的 getters */
  store.getters = {};
  /** 注册嵌套模块时需要更新父模块的 localGetters 为最新值 */
  store._makeLocalGettersCache = Object.create(null);
  const wrappedGetters = store._wrappedGetters;
  const computed: Record<string, any> = {};

  forEachValue(wrappedGetters, (fn, key) => {
    computed[key] = () => fn(store);
    /** 计算属性代理到会代理到 vue 实例上， store.getters 从 vue 实例取数据  */
    Object.defineProperty(store.getters, key, {
      enumerable: true, // 重要
      get: () => (store._vm ? store._vm[key] : undefined),
    });
  });
  const silent = Vue.config.silent;

  Vue.config.silent = true;

  store._vm = new Vue({
    data: {
      $$state: state, // state 变为响应式
    },
    computed, // getters 变为计算属性
  });
  Vue.config.silent = silent;

  if (store.strict) {
    enableStrictMode(store);
  }
  if (oldVm) {
    if (hot) {
      store._withCommit(() => {
        oldVm._data.$$state = null;
      });
    }
    /** 清除老实例 */
    Vue.nextTick(() => oldVm.$destroy());
  }
}
export function resetStore(store: Store, hot?: boolean) {
  store._actions = Object.create(null);
  store._mutations = Object.create(null);
  store._wrappedGetters = Object.create(null);
  store._modulesNamespaceMap = Object.create(null);
  const state = store.state;

  // init all modules
  installModule(store, state, [], store._modules.root, true);
  // reset vm
  resetStoreVM(store, state, hot);
}
