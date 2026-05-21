import {useSyncExternalStore} from "react";

const subscribe = () => () => {};

export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true, // client snapshot → mounted
    () => false, // server snapshot → not mounted
  );
}
