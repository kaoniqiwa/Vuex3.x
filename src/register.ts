import { ModuleContext } from "./interface/module.interface";
import { FuncType } from "./interface/store.interface";
import { Store } from "./store";
import { __DEV__, isPromise } from "./util";

/**
 * mutation 的作用仅仅值改变 state 的值
 * @param store
 * @param type
 * @param handler
 * @param local
 */
export function registerMutation(
  store: Store,
  type: string,
  handler: FuncType,
  local: ModuleContext
) {
  const entry = store._mutations[type] || (store._mutations[type] = []);

  entry.push(function wrappedMutationHandler(payload: any) {
    handler.call(store, local.state, payload);
  });
}

/**
 * 异步操作放入 action 中，所以 action 返回 promise 来监听何时完成操作
 * @param store
 * @param type
 * @param handler
 * @param local
 */
export function registerAction(
  store: Store,
  type: string,
  handler: FuncType,
  local: ModuleContext
) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push(function wrappedActionHandler(payload: any) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state,
      },
      payload
    );
    if (!isPromise(res)) {
      /** 异步更新需要返回 Promise 来通知更新完毕 */
      res = Promise.resolve(res);
    }

    return res as Promise<any>;
  });
}
export function registerGetter(
  store: Store,
  type: string,
  rawGetter: FuncType,
  local: ModuleContext
) {
  if (store._wrappedGetters[type]) {
    if (__DEV__) {
      console.error(`[vuex] duplicate getter key: ${type}`);
    }
    return;
  }
  store._wrappedGetters[type] = function wrappedGetter(store: Store) {
    return rawGetter(local.state, local.getters, store.state, store.getters);
  };
}
