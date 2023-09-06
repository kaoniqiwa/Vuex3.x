import { Component } from "./@types/vue";
import { isFunction } from "./util";

export default function applyMixin(Vue: typeof Component) {
  /*获取Vue版本，鉴别Vue1.0还是Vue2.0*/
  const version = Number(Vue.version.split(".")[0]);

  if (version >= 2) {
    /** 通过 mixin 将 vuexInit 混淆到所有 Vue 实例的 beforeCreate 钩子中 */
    Vue.mixin({ beforeCreate: vuexInit });
  } else {
    const _init = Vue.prototype._init;
    Vue.prototype._init = function (options: Record<string, any> = {}) {
      options.init = options.init ? [vuexInit].concat(options.init) : vuexInit;
      _init.call(this, options);
    };
  }
}

/**
 *  组件创建从根组件开始，一层层往下创建，所以根组件有 store ,子组件就能获取 store
 */
function vuexInit(this: Component) {
  const options = this.$options;
  if (options.store) {
    // 根实例上的store
    /** 只有根 Vue 实例上的 options 才有 store */
    this.$store = isFunction(options.store) ? options.store() : options.store;
  } else {
    // 子组件从父组件拿 $store
    if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store;
      // vue-router 是子组件查询根组件的 $router
      // vuex 是子组件和根组件都有一份 $store
    }
  }
}
