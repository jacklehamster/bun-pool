# bun-pool
This typescript library provides an object pool that's flexible and usable for any type of objects. It's written using bun, that's why it's called bun-pool.

![](https://jacklehamster.github.io/bun-pool/icon.png)

# Benefits of ObjectPool

ObjectPool are used mainly in games, where performance is very critical on a frame by frame basis.
One thing that can drain performance in your game is the creation/destruction of objects from the heap.

Let's say you are shooting lazers out of a ship. Each lazer needs its own information such as position, direction, and perhaps strength / color. A way to achieve that is to create a class containing those information, allocate it when the lazer is shot, and de-allocate when the lazer hits target or is out of the screen. Unfortunately, doing this repeatedly eventually triggers the garbage collector, which will cause the the game to suddenly pause for a few milliseconds, running the game experience.

Instead, you can use an object pool to handle object creation.
- Upon creation, the ObjectPool will look for exising objects that got recycled. If none exists, a new object is instantiated. If there are instances in the recycle bin, one gets taken out, and its values are either reset, or initialized to the values prescribed.
- Upon destruction, the object disposed is recycled back into the ObjectPool, so that it can be reused later.

# The danger of ObjectPools

Missuse of ObjectPools can cause performance issues that are worst than the one caused by the garbage collector. That's why inexperienced developers will advice against using those, while in fact, its benefits are sometimes game changers for performance.

For every objects created, you need to remember to recycle it back. This is something you wouldn't have to worry about in JavaScript, since dereferenced object get taken care off by the garbage collector. Yet, object pools need a bit more careful attention in that regards.

Another problem could be to simply recycle an object that is already used some other place. Since the recycled object can be reused later, you will end up with two distinct instances reference by two separate component (or the same component referencing the same object twice), causing corruptions between those two instances.

This really means that you really need to know what you're doing when working with object pools.

# Best practices

## Use ObjectPools for temporary objects that you recycle

Let's say you are doing several operations within one function. You need some arrays, simply to run your algorithms. Those arrays will not be retained anywhere, and you won't need them after the function call.

Simply create those arrays using the ObjectPool, and recycle them at the end of the function call.

Watch out for "return" in the middle of the function. Don't forget to call recycle right before those return statements.

## Use one ObjectPool for a class with a list of objects that will grow or shrink

This matches the example of the ship shooting lazers. Use an ObjectPool of lazers, which will create when a lazer when it's shot out, and recycle it when it hits target. There will be a class holding those lazers, and that class can also own an ObjectPool of lazer from which it can create / destroy lazer instances.

## Use ObjectPool for temporary objects, and recycleAll in one go

One of the advantages of "bun-pool", which I haven't seen in other object pool implementations, is the concept of recycling everything you used with one command.
This helps eliminate the annoyance of having to keep track of all the items that needs recycling.

The idea is simple:
- During one session (usually one frame), you repeatedly create instances out your the ObjectPool. Those are all temporary objects, that will not be stored, and will not be needed once the frame is over.

You can simply create those objects without worrying about recycling, then at the end of the frame when all the work is done, call "recycleAll". It will simply recycle all objects you have used within that frame. Let's say you have created 200 matrices used for temporary operations. Those matrices will all be recycled at the end of your frame. The next frame, whenever you need a matrix, it won't be allocated but taken out of the recycle bin.

### Using an ObjectPool as opposed to reusing one single object.

Before using ObjectPool, I found that I could easily re-use one single object for temporary operations. For example:

```typescript
const _position = [0, 0, 0];
export function transformToPosition(transform: Float32Array) {
  _position[0] = transform[12];
  _position[1] = transform[13];
  _position[2] = transform[14];
  return _position;
}
```

This retrieve the [x,y,z] position of a matrix transform.
The problem arises when I need to perform operations on the result of that function. Because that temporary object needs to be used twice in a row, it would get corrupted between both usage.

```typescript
const vec1 = transformToPosition(transform1);
const vec2 = transformToPosition(transform2);
const d = distance(vec1, vec2); //  <= vec1 and vec2 point to the same array
```

Using an ObjectPool is best in this case, and practically as as performant.

# Performance

- create: O(1)
- recycle: O(1)
- recycleAll: O(n) - n being the number of items created.

Note that since recycleAll will only be called one recycle per "create", it's essentially equivalent to being O(1).

# Usage

## Basic usage

The ObjectPool class is generic, and requires at last one template type. Initialize an ObjectPool passing the type that you want to clone.

ex:
```es6
type Point = {
  x: number;
  y: number;
};

const pool = new ObjectPool<Point[], [number, number]>((point, x, y) => {
  if (!point) {
    return { x, y };
  }
  point.x = x;
  point.y = y;
  return point;
});
```

This creates an object pool that can produce an array of strings. You pass a lambda that defines how the ObjectPool behaves, whether it's for creating or reusing elements.
- If the recycle bin is empty, instantiate a new point with {x, y}.
- If the recycle bin has arrays, retrieve a point and assign it's x, y properties to the ones desired.

The `[number, number]` is an optional template argument, indicating the parameters to be passed when creating the object (if any).

```typescript
const newSet = pool.create(10, 20);
```

## Use the RecycleCallback

After the mandatory "initializer" callback, you can pass an optional onRecycle callback into the constructor, instructing the ObjectPool to perform operations right before an element gets recycled. Typically, you would use it if you need to ensure all objects are clean before they are put into the recycler.

```es6
type LinkList<T> {
  value?: Obj;
  next?: LinkList;
}

const pool = new ObjectPool<LinkList[]>(list => {
  if (!list) {
    return {};
  }
  return list;
}, (list) => {
  list.value = undefined;
  list.next = undefined;
});
```
As you can see from the example above, having "LinkList" objects in the pool pointing to random objects might not be desired. So instead of clearing values upon initialization, you can clear them right before recyling.

## Using recycle all

When using recycleAll, you don't have to worry about calling "recycle". You just need to know that at a particular point, you won't need any of the objects previously created. Call recycleAll at that point and simply reclaim all created objects back into the recycle bin for reuse next time.

```es6
type Point = {
  x: number;
  y: number;
};

const pool = new ObjectPool<Point[], [number, number]>((point, x, y) => {
  if (!point) {
    return { x, y };
  }
  point.x = x;
  point.y = y;
  return point;
});

function loop() {
  for (let i = 0; i < 100; i++) {
    const p1 = pool.create(0, 0);
    const p2 = pool.create(1, 1);
    //  ... do a bunch of stuff
  }

  pool.recycleAll();
}
requestAnimationFrame(loop);
```
In the example above, you create objects out of a pool in a loop, then recycle them all at the end. The next frame, you will reuse all those same objects. This ensures you don't keep re-allocating objects every frame.

# Other use cases

## Monitor the amount of objects allocated

You can keep track of the total number of objects allocated by calling `countObjectsInExistence()`. As you run your game or app, ensure that `countObjectsInExistence()` doesn't increase continously.

The count will increase initially, but eventually should stabilize. At some point, you'll realize that it stays constant. That means that no objects are getting allocated anymore, and the ObjectPool is used properly.

## Adjust warning limit

If the ObjectPool is misused and objects are continously created, it will eventually reach a warning limit. That limit can be adjusted.
```javascript
objectPool.warningLimit = 100000;
```
- If you know you will need more than 50000 objects at a time, you can increase that limit.
- If you work with very little objects, perhaps ~10-20 at a time, it will take a while before you reach the limit. You could set the limit to 100, so you'll know immediately that you did something wrong with the ObjectPool.

## Clear memory

You can send all objects back to the garbage collector by calling `clear()`. This would be the case when you're done with a game scene, and perhaps you no longer need one particular type of object. When that happens, you can clear its ObjectPool.
Note that you don't really need to call that. Deleting the ObjectPool itself and let the garbage collector handle it has the same effect. 

# Prerequisite

## Install bun

https://bun.sh/

```bash
curl -fsSL https://bun.sh/install | bash
```

# Links

## Run example

[https://jacklehamster.github.io/bun-pool/example/](https://jacklehamster.github.io/bun-pool/example/)

## Github Source

[https://github.com/jacklehamster/bun-pool/](https://github.com/jacklehamster/bun-pool/)
