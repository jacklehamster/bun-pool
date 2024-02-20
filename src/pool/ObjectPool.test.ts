import { beforeEach, describe, expect, it } from 'bun:test';
import { ObjectPool } from "./ObjectPool";

describe('ObjectPool', () => {
  let countCreated = 0;
  let pool: ObjectPool<{ text: string }, [string, number]>;
  beforeEach(() => {
    countCreated = 0;
    pool = new ObjectPool((elem, base, id) => {
      if (!elem) {
        countCreated++;
        return { text: `${base}-${id}` };
      }
      elem.text = `${base}-${id}`;
      return elem;
    }, elem => {
      elem.text = "";
    });
  });

  it('should create objects before recycling', async () => {
    pool.create("one", 1);
    pool.create("two", 2);
    expect(countCreated).toEqual(2);
  });

  it('should clean objects before recycling', async () => {
    const elem = pool.create("one", 1);
    pool.recycle(elem);
    pool.create("two", 2);
    expect(countCreated).toEqual(1);
  });

  it('should reuse recycled objects when bulk recycled', async () => {
    pool.create("one", 1);
    pool.create("two", 2);
    pool.create("three", 3);
    pool.recycleAll();
    pool.create("four", 4);
    pool.create("five", 5);
    expect(countCreated).toEqual(3);
  });

  it('should clear recycled objects', async () => {
    pool.create("one", 1);
    pool.create("two", 2);
    pool.create("three", 3);
    pool.recycleAll();
    pool.clear();
    pool.create("four", 4);
    pool.create("five", 5);
    expect(countCreated).toEqual(5);
  });

  it('test perf', async () => {
    const p = performance.now();
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      const a = pool.create("one", 1);
      const b = pool.create("two", 2);
      pool.recycle(a);
      const c = pool.create("three", 3);
      pool.recycle(b);
      pool.recycle(c);
    }
    console.info("Time taken: ", performance.now() - start, "ms");
  });
});
