export function createStore(initialState) {
  let state = initialState;
  const subscribers = new Set();

  return {
    get() {
      return state;
    },
    set(nextState) {
      state = typeof nextState === "function" ? nextState(state) : nextState;
      subscribers.forEach((subscriber) => subscriber(state));
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
  };
}
