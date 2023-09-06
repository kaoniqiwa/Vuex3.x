import { Vue } from "./install";
import { ActionPayload } from "./interface/action.interface";
import { CommitOptions } from "./interface/commit.interface";
import { DispatchOptions } from "./interface/dispatch.interface";
import { MutationPayload } from "./interface/mutation.interface";
import Module from "./module/module";
import { registerAction, registerGetter, registerMutation } from "./register";
import { Store } from "./store";
import { __DEV__, unifyObjectStyle } from "./util";

export function installModule(
  store: Store,
  rootState: Record<string, any>,
  path: string[],
  module: Module,
  hot: boolean = false
) {
  const isRoot = !path.length;
  /** 重要属性，getters ,actions, mutations 的访问都依赖 namespace
   *  namespace 形式: module_a/module_b/
   */
  const namespace = store._modules.getNamespace(path);

  if (module.namespaced) {
    /** 动态注册的模块不能是相同模块名 */
    if (store._modulesNamespaceMap[namespace] && __DEV__) {
      console.error(
        `[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join(
          "/"
        )}`
      );
    }
    store._modulesNamespaceMap[namespace] = module;
  }
  if (!isRoot && !hot) {
    let parentState = getNestedState(rootState, path.slice(0, -1));
    let moduleName = path[path.length - 1];
    store._withCommit(() => {
      if (__DEV__) {
        /**
         * 模块名称与 parentState 属性重名时，模块的状态覆盖 parentState 属性值，报警告
         * 除非 {preserveState:true}
         * {
         *    state:{a:1},
         *    modules:{
         *      a:{
         *        state:{name:"module_a"}
         *      }
         *    }
         * }
         */
        if (moduleName in parentState) {
          console.warn(
            `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join(
              "."
            )}"`
          );
        }
      } /** 动态注册模块时，state 需要响应式设置 */
      Vue.set(parentState, moduleName, module.state);
      /**
       * 子模块的状态覆盖父模块状态中的相同名称
       * {
       *    state:{module_a:100},
       *    modules:{module_a:{state:{count:1}}}
       * }
       */
    });
  }

  /** 创建模块自身的上下级环境,回调函数的参数是模块自身环境+根模块环境 */
  const local = (module.context = makeLocalContext(store, namespace, path));
  /**  遍历注册 mutation */
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });

  /**  遍历注册 action */
  module.forEachAction((action, key) => {
    /**
     * {root:true,handler:function(){...}} 子命名空间中可以注册全局触发的 action
     *  但是参数仍是子命名空间的参数
     *
     **/
    const type = action.root ? key : namespace + key;
    const handler = action.handler || action;
    registerAction(store, type, handler, local);
  });
  /**  遍历注册 getter */
  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });
  /** 遍历安装子模块 */
  module.forEachChild((module, key) => {
    installModule(store, rootState, path.concat(key), module, hot);
  });
}

/** 由于在 getters,mutations,actions 中使用的都是各自模块内的东西，不是全局，所以需要local一下 */
function makeLocalContext(store: Store, namespace: string, path: string[]) {
  const noNamespace = namespace === "";
  const local = {
    dispatch: noNamespace
      ? store.dispatch
      : function (
          _type: string | ActionPayload,
          _payload?: any,
          _options?: DispatchOptions
        ) {
          /** 由于需要提供报错 type 信息，所以不解构返回值 */
          let args = unifyObjectStyle(_type, _payload, _options);
          const { payload, options } = args;
          let { type } = args;
          /** 在子命名空间中触发全局 action */
          if (options && options.root) {
            type = type;
          } else {
            type = namespace + type;
            if (__DEV__ && !store._actions[type]) {
              console.error(
                `[vuex] unknown local action type: ${args.type}, global type: ${type}`
              );
              return;
            }
          }
          return store.dispatch(type, payload);
        },
    commit: noNamespace
      ? store.commit
      : function (
          _type: string | MutationPayload,
          _payload?: any,
          _options?: CommitOptions
        ) {
          let args = unifyObjectStyle(_type, _payload, _options);
          const { payload, options } = args;
          let { type } = args;
          /** 在子命名空间中触发全局 mutation */
          if (options && options.root) {
            type = type;
          } else {
            type = namespace + type;
            if (__DEV__ && !store._mutations[type]) {
              console.error(
                `[vuex] unknown local action type: ${args.type}, global type: ${type}`
              );
              return;
            }
          }
          return store.commit(type, payload, options);
        },
    getters: () => {
      return {} as Record<string, any>;
    },
    state: () => {
      return {} as Record<string, any>;
    },
  };
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace),
    },
    state: {
      /** 等到 state 挂载到 vue 实例上后再访问 state */
      get: () => getNestedState(store.state, path),
    },
  });

  return local;
}
/**
 * 通过 Store.state 递归查询，没有必要传 state 参数
 * @param state
 * @param path
 * @returns
 */
export function getNestedState(state: Record<string, any>, path: string[]) {
  return path.reduce((state, key) => state[key], state);
}

function makeLocalGetters(store: Store, namespace: string) {
  if (!store._makeLocalGettersCache[namespace]) {
    let splitPos = namespace.length;
    let gettersProxy: Record<string, any> = {};
    Object.keys(store.getters).forEach((type) => {
      if (type.slice(0, splitPos) != namespace) return;
      let localType = type.slice(splitPos);
      Object.defineProperty(gettersProxy, localType, {
        get: () => store.getters[type],
      });
    });
    store._makeLocalGettersCache[namespace] = gettersProxy;
  }

  return store._makeLocalGettersCache[namespace];
}
