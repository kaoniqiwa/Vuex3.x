import { Payload } from "./store.interface";

export interface CommitOptions {
  silent?: boolean;
  /** true 则加上命名空间路径 */
  root?: boolean;
}

export interface Commit {
  (type: string, payload?: any, options?: CommitOptions): void;
  <P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
}
