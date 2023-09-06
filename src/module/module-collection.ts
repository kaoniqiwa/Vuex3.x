import { ModuleOptions } from "../interface/module.interface";
import { HotUpdateOptions } from "../interface/store.interface";
import { __DEV__, forEachValue } from "../util";
import Module from "./module";

export default class ModuleCollection {
  root!: Module;
  constructor(rawRootModule: ModuleOptions) {
    this.register([], rawRootModule, false);
  }

  /** 注册模块，形成树状结构 */
  register(path: string[], rawModule: ModuleOptions, runtime = true) {
    const newModule = new Module(rawModule, runtime);
    if (path.length == 0) {
      this.root = newModule;
    } else {
      /**  排除最后一个路径，最后一个就是当前的 newModule 路径，还未添加入数据结构中 */
      const parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      // 递归注册子模块
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        // concat 不修改 path 值，原始 path 需要被其他分支使用
        this.register(path.concat(key), rawChildModule, runtime);
      });
    }
  }
  /**
   * 从根模块开始，按照 path 路径查找最后一个子模块
   * @param path
   * @returns
   */
  get(path: string[]) {
    return path.reduce((module: Module, key: string) => {
      try {
        module = module.getChild(key);
      } catch (e: any) {
        console.error(e);
      }
      return module;
    }, this.root);
  }
  /**
   * 从根模块开始，根据 path 数组，查找子模块，如果子模块 namespaced,则将子模块路径加入 namespace 结果
   * @param path
   * @returns
   */
  getNamespace(path: string[]) {
    let module = this.root;

    return path.reduce((namespace, moduleName: string) => {
      module = module.getChild(moduleName);
      return namespace + (module.namespaced ? moduleName + "/" : "");
    }, "");
  }
  isRegistered(path: string[]) {
    let parent = this.get(path.slice(0, -1));
    if (parent) {
      return parent.hasChild(path[path.length - 1]);
    }
    return false;
  }
  unregister(path: string[]) {
    let parent = this.get(path.slice(0, -1));
    let key = path[path.length - 1];
    if (parent) {
      if (parent.hasChild(key)) {
        parent.removeChild(key);
      } else {
        if (__DEV__) {
          console.warn(
            `[vuex] trying to unregister module '${key}', which is ` +
              `not registered`
          );
        }
        return;
      }
    }
  }
  update(rawRootModule: Pick<ModuleOptions, "actions" | "mutations">) {
    update([], this.root, rawRootModule);
  }
}

function update(
  path: string[],
  targetModule: Module,
  newModule: HotUpdateOptions
) {
  /** 更新 RootModule */
  targetModule.update(newModule);

  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (targetModule.hasChild(key)) {
        update(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      } else {
        if (!targetModule.getChild(key)) {
          if (__DEV__) {
            console.warn(
              `[vuex] trying to add a new module '${key}' on hot reloading, ` +
                "manual reload is needed"
            );
          }
          return;
        }
      }
    }
  }
}
