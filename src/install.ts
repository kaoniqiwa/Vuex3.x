import { Component } from "./@types/vue";
import applyMixin from "./mixin";
import { __DEV__ } from "./util";

export let Vue: typeof Component;

/*暴露给外部的插件install方法，供Vue.use调用安装插件*/
export function install(_vue: typeof Component) {
  if (Vue && Vue === _vue) {
    /** 避免重复安装（Vue.use内部也会检测一次是否重复安装同一个插件）*/
    if (__DEV__) {
      console.error(
        "[vuex] already installed. Vue.use(Vuex) should be called only once."
      );
    }
    return;
  }
  /** 保存Vue，同时用于检测是否重复安装 */
  Vue = _vue;
  /** 将vuexInit混淆进Vue的beforeCreate(Vue2.0)或_init方法(Vue1.0) */
  applyMixin(Vue);
}
