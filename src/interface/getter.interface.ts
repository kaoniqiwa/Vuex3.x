export type Getter<S, R> = (
  state: S,
  getters: any,
  rootState: R,
  rootGetters: any
) => any;
export interface GetterTree<S, R> {
  [key: string]: Getter<S, R>;
}
