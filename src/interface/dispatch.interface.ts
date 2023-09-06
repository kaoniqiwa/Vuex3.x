import { Payload } from "./store.interface";

export interface DispatchOptions {
  /** true 则加上命名空间路径 */
  root?: boolean;
}

export interface Dispatch {
  (type: string, payload?: any, options?: DispatchOptions): Promise<any>;
  <P extends Payload>(
    payloadWithType: P,
    options?: DispatchOptions
  ): Promise<any>;
}
