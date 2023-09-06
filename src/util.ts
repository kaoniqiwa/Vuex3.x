import { ActionPayload } from "./interface/action.interface";
import { CommitOptions } from "./interface/commit.interface";
import { MutationPayload } from "./interface/mutation.interface";
import { FuncType } from "./interface/store.interface";

export const __DEV__ = process.env.NODE_ENV !== "production";
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === "function";
}

export function forEachValue<T>(obj: Record<string, T>, fn: FuncType) {
  Object.keys(obj).forEach((key) => {
    fn(obj[key], key);
  });
}

export function assert(condition: any, msg: string) {
  if (!!!condition) {
    throw new Error(`[vuex] ${msg}`);
  }
}

export function isObject(o: any): boolean {
  return o !== null && (typeof o === "function" || typeof o === "object");
}
export function isPlainObject(o: any) {
  return (
    isObject(o) &&
    Object.prototype.toString.call(o) === "[object Object]" &&
    (typeof o.constructor !== "function" || o.constructor.name === "Object")
  );
}

export function unifyObjectStyle(
  type: string | MutationPayload | ActionPayload,
  payload: any,
  options?: CommitOptions
) {
  /** 类似计算属性的处理 */
  if (typeof type !== "string" && type.type) {
    options = payload;
    payload = type;
    type = type.type;
  }
  if (__DEV__) {
    /** 处理完之后的 type 要是字符串类型 */
    assert(
      typeof type === "string",
      `expects string as the type, but found ${typeof type}.`
    );
  }
  return { type: type as string, payload, options };
}

export function isPromise(val: any) {
  return val && typeof val.then === "function";
}
