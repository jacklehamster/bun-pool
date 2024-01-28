import { ItemPool } from "./ItemPool";

export type InitCall<T, A extends any[] = []> = (elem: T | undefined, ...params: A) => T;
export type RecycleCallback<T> = (elem: T) => void;

export class ObjectPool<T, A extends any[] = []> implements ItemPool<T, A> {
  warningLimit = 50000;

  readonly #usedObjects = new Set<T>();
  readonly #recycler: T[] = [];
  constructor(
    private initCall: InitCall<T, A>,
    private onRecycle?: RecycleCallback<T>) {
  }

  create(...params: A): T {
    const recycledElem = this.#recycler.pop();
    if (recycledElem) {
      return this.initCall(recycledElem, ...params);
    }
    const elem = this.initCall(undefined, ...params);
    this.#usedObjects.add(elem);
    this.#checkObjectExistence();
    return elem;
  }

  recycle(element: T): undefined {
    this.#usedObjects.delete(element);
    this.#addToRecycler(element);
  }

  recycleAll() {
    for (const elem of this.#usedObjects) {
      this.recycle(elem);
    }
    this.#usedObjects.clear();
  }

  clear() {
    //  dispose of objects, leave it to garbage collector
    this.#recycler.length = 0;
    this.#usedObjects.clear();
  }

  countObjectsInExistence() {
    return this.#usedObjects.size + this.#recycler.length;
  }

  #addToRecycler(element: T) {
    this.#recycler.push(element);
    this.onRecycle?.(element);
  }

  #checkObjectExistence() {
    if (this.countObjectsInExistence() === this.warningLimit) {
      console.warn("ObjectPool already created", this.#usedObjects.size + this.#recycler.length, "in", this.constructor.name);
    }
  }
}
