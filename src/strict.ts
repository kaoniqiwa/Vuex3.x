import { Component } from "./@types/vue";
import { Store } from "./store";
import { assert } from "./util";
export function enableStrictMode(store: Store) {
  if (store._vm) {
    /** 深度监听 $$data 属性, 一旦发生改变，回调函数被调用 */
    store._vm.$watch(
      function (this: Component) {
        return this._data.$$state;
      },
      function callback() {
        assert(
          /* 检测store中的_committing的值，如果是 false 代表不是通过mutation的方法修改的 */
          store._committing,
          `Do not mutate vuex store state outside mutation handlers.`
        );
      },
      {
        deep: true,
        sync: true,
      }
    );
  }
}
