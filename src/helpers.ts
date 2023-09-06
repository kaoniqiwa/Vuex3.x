import { Component } from "./@types/vue";
import { CommitOptions } from "./interface/commit.interface";
import { DispatchOptions } from "./interface/dispatch.interface";
import { KeyValuePair } from "./interface/helpers.interface";
import {
  FuncType,
  ObjectFuncType,
  ObjectType,
} from "./interface/store.interface";
import { Store } from "./store";
import { __DEV__, assert, isFunction, isPlainObject } from "./util";

/** 获得 namespace 对应的 module,module 中的 context 是本地化后的对象,需要的正是 context*/
function getModuleByNamespace(store: Store, helper: string, namespace: string) {
  let module = store._modulesNamespaceMap[namespace];
  if (__DEV__ && !module) {
    console.error(
      `[vuex] module namespace not found in ${helper}(): ${namespace}`
    );
  }
  return module;
}
function normalizeNamespace(fn: FuncType) {
  return (namespace: any, map: ObjectType) => {
    if (typeof namespace !== "string") {
      /** 全局命名空间 */
      map = namespace;
      namespace = "";
    } else {
      /** module_a/module_b => module_a/module_b/ */
      if (namespace[namespace.length - 1] !== "/") {
        namespace += "/";
      }
    }
    return fn(namespace, map);
  };
}

/**
 * normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }, { key: 3, val: 3 } ]
 * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
 * @param states
 * @returns
 */
function normalizeMap(states: ObjectType): KeyValuePair[] {
  if (!isValidMap(states)) {
    return [];
  }
  return Array.isArray(states)
    ? states.map((val) => ({
        key: val,
        val: val,
      }))
    : Object.keys(states).map((key: keyof typeof states) => ({
        key: key,
        val: states[key],
      }));
}

function isValidMap(map: any) {
  return Array.isArray(map) || isPlainObject(map);
}

export const mapState = normalizeNamespace(
  (namespace: any, states: ObjectType) => {
    const res: ObjectFuncType = {};

    if (__DEV__ && !isValidMap(states)) {
      console.error(
        "[vuex] mapState: mapper parameter must be either an Array or an Object"
      );
    }

    normalizeMap(states).forEach(({ key, val }) => {
      /** key 为计算属性名 */
      res[key] = function mappedState(this: Component) {
        let state = this.$store.state;
        let getters = this.$store.getters;
        if (namespace) {
          let module = getModuleByNamespace(this.$store, "mapState", namespace);
          if (!module) {
            return;
          }
          state = module.context.state;
          getters = module.context.getters;
        }

        /** this 指向 vue 实例，计算属性中 箭头函数的 this 指向 window */
        // return isFunction(val) ? val.call(this, state, getters) : state[val];
        if (isFunction(val)) {
          return val.call(this, state, getters);
        } else {
          if (__DEV__) {
            if (!(val in state)) {
              console.error(`[vuex] unknown state property: ${val}`);
              return;
            }
          }
          return state[val];
        }
      };
      // res[key].vuex = true;
    });

    return res;
  }
);

export const mapGetters = normalizeNamespace(
  (namespace: any, getters: ObjectType) => {
    const res: ObjectFuncType = {};

    if (__DEV__ && !isValidMap(getters)) {
      console.error(
        "[vuex] mapGetters: mapper parameter must be either an Array or an Object"
      );
    }
    normalizeMap(getters).forEach(({ key, val }) => {
      res[key] = function mappedGetter(this: Component) {
        /** getters中已经有规范化的属性: getters:{module_a/module_b/getCount:...} */
        val = namespace + val;
        if (namespace) {
          let module = getModuleByNamespace(
            this.$store,
            "mappedGetter",
            namespace
          );
          if (!module) {
            return;
          }
        }

        if (__DEV__) {
          if (!(val in this.$store.getters)) {
            console.error(`[vuex] unknown getter: ${val}`);
            return;
          }
        }
        return this.$store.getters[val];
      };
      // res[key].vuex = true;
    });

    return res;
  }
);

export const mapMutations = normalizeNamespace(
  (namespace: any, mutations: ObjectType) => {
    const res: ObjectFuncType = {};

    if (__DEV__ && !isValidMap(mutations)) {
      console.error(
        "[vuex] mapMutations: mapper parameter must be either an Array or an Object"
      );
    }
    normalizeMap(mutations).forEach(({ key, val }) => {
      res[key] = function mappedMutation(
        this: Component,
        payload?: any,
        options?: CommitOptions
      ) {
        if (options) {
          assert(
            isPlainObject(options),
            "[vuex] mapMutations: commit options must be an Object"
          );
        }
        let commit = this.$store.commit;
        if (namespace) {
          let module = getModuleByNamespace(
            this.$store,
            "mapMutations",
            namespace
          );
          if (!module) {
            return;
          }
          commit = module.context.commit;
        }

        return isFunction(val)
          ? val.apply(this, [commit, payload, options])
          : commit.apply(this.$store, [val, payload, options]);
      };
    });
    return res;
  }
);

export const mapActions = normalizeNamespace(
  (namespace: any, actions: ObjectType) => {
    const res: ObjectFuncType = {};
    if (__DEV__ && !isValidMap(actions)) {
      console.error(
        "[vuex] mapActions: mapper parameter must be either an Array or an Object"
      );
    }
    normalizeMap(actions).forEach(({ key, val }) => {
      res[key] = function mappedAction(
        this: Component,
        payload?: any,
        options?: DispatchOptions
      ) {
        let dispatch = this.$store.dispatch;

        if (namespace) {
          let module = getModuleByNamespace(
            this.$store,
            "mapActions",
            namespace
          );
          if (!module) {
            return;
          }
          dispatch = module.context.dispatch;
        }
        return isFunction(val)
          ? val.apply(this, [dispatch, payload, options])
          : dispatch.apply(this.$store, [val, payload, options]);
      };
    });
    return res;
  }
);

/***
 *  fn.bind(thisArgs,arg1,...) 固定住参数
 */
export const createNamespacedHelpers = (namespace: string) => {
  return {
    mapState: mapState.bind(null, namespace),
    mapGetters: mapGetters.bind(null, namespace),
    mapMutations: mapMutations.bind(null, namespace),
    mapActions: mapActions.bind(null, namespace),
  };
};
