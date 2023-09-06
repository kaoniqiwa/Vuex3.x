import { Commit } from "./commit.interface";
import { Dispatch } from "./dispatch.interface";
import { Store } from "../store";
import { Payload } from "./store.interface";

export interface ActionPayload extends Payload {
  payload: any;
}
export interface ActionContext<S, R> {
  dispatch: Dispatch;
  commit: Commit;
  state: S;
  getters: any;
  rootState: R;
  rootGetters: any;
}
export type ActionHandler<S, R> = (
  this: Store,
  injectee: ActionContext<S, R>,
  payload?: any
) => any;
export interface ActionObject<S, R> {
  root?: boolean;
  handler: ActionHandler<S, R>;
}
export type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>;

export interface ActionTree<S, R> {
  [key: string]: Action<S, R>;
}

export type ActionSubscriber<P = ActionPayload, S = Record<string, any>> = (
  action: P,
  state: S
) => any;
export type ActionErrorSubscriber<
  P = ActionPayload,
  S = Record<string, any>
> = (action: P, state: S, error: Error) => any;

export interface ActionSubscribersObject<
  P = ActionPayload,
  S = Record<string, any>
> {
  before?: ActionSubscriber<P, S>;
  after?: ActionSubscriber<P, S>;
  error?: ActionErrorSubscriber<P, S>;
}
export type SubscribeActionOptions<
  P = ActionPayload,
  S = Record<string, any>
> = ActionSubscriber<P, S> | ActionSubscribersObject<P, S>;
