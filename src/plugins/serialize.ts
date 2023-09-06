import { Store } from "../store";

/** Vuex 插件就是一个函数，Vuex.Store 中会调用它，并且将 store 实例作为实参传入*/
export function createSerialize() {
  return (store: Store) => {
    let localState = localStorage.getItem("vuex:state");
    if (localState) {
      store.replaceState(JSON.parse(localState));
    }

    const unsubscribe = store.subscribe((mutation, state) => {
      console.log(mutation, state.age);
      localStorage.setItem("vuex:state", JSON.stringify(store.state));
    });
    setTimeout(unsubscribe, 2000);
  };
}
