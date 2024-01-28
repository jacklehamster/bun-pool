import { ObjectPool } from "bun-template";
import Bao from "baojs";
import serveStatic from "serve-static-bun";
import { ItemPool } from "bun-template";

const app = new Bao();

const pool: ItemPool<string[], [string]> = new ObjectPool((elem, str) => {
  if (!elem) {
    return [str];
  }
  elem.length = 1;
  elem[0] = str;
  return elem;
});
console.log(pool.create("test"));
pool.recycleAll();
console.log(pool.create("test2"));


app.get("/*any", serveStatic("/", { middlewareMode: "bao" }));

const server = app.listen({ port: 3000 });
console.log(`Listening on http://localhost:${server.port}`);
