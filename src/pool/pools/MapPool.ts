import { ObjectPool } from "../ObjectPool";

export class MapPool<K, V> extends ObjectPool<Map<K, V>, []> {
  constructor() {
    super(elem => {
      if (!elem) {
        return new Map<K, V>();
      }
      return elem;
    }, elem => elem.clear());
  }
}
