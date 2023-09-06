import { Store } from "../store";
interface GlobalAPI {
  mixin: (mixin: Object) => GlobalAPI;
}
interface Config {
  silent: boolean;
}
type ComponentOptions = { [key: string]: any };
declare class Component {
  static mixin: GlobalAPI["mixin"];
  static set: <T>(
    target: Object | Array<T>,
    key: string | number,
    value: T
  ) => T;

  static delete<T>(target: Object | Array<T>, key: string | number);
  static version: string;
  static config: Config;
  static nextTick: any;

  constructor(options?: any);

  _init: Function;
  _data: Record<string, any>;

  $options: ComponentOptions;

  $store: Store;

  [key: string]: any;
}

interface WatchOptions {}
