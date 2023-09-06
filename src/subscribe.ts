import { SubscribeOptions } from "./interface/store.interface";

export function genericSubscribe<T>(
  fn: T,
  subs: Array<T>,
  options?: SubscribeOptions
) {
  if (subs.indexOf(fn) == -1) {
    options && options.prepend ? subs.unshift(fn) : subs.push(fn);
  }
  return () => {
    let index = subs.indexOf(fn);
    if (index > -1) subs.splice(index, 1);
  };
}
