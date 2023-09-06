import { Payload } from "./store.interface";

export type Mutation<S> = (state: S, payload?: any) => any;

export interface MutationTree<S> {
  [key: string]: Mutation<S>;
}
export interface MutationPayload extends Payload {
  payload: any;
}
export interface MutationSubscriber {
  (mutation: MutationPayload, state: Record<string, any>): any;
}
