import { ItemPool } from "./ItemPool";
export type InitCall<T, A extends any[] = []> = (elem: T | undefined, ...params: A) => T;
export type RecycleCallback<T> = (elem: T) => void;
export declare class ObjectPool<T, A extends any[] = []> implements ItemPool<T, A> {
    #private;
    private initCall;
    private onRecycle?;
    static warningLimit: number;
    constructor(initCall: InitCall<T, A>, onRecycle?: RecycleCallback<T> | undefined);
    create(...params: A): T;
    recycle(element: T): undefined;
    recycleAll(): void;
    clear(): void;
    private checkObjectExistence;
}
