import { ObjectPool } from "bun-template";
import Bao from "baojs";
import serveStatic from "serve-static-bun";

const app = new Bao();

const pool = new ObjectPool<string[]>(elem => {
  if (!elem) {
    return [];
  }
  elem.length = 0;
  return elem;
});
console.log(pool.create());
pool.recycleAll();
console.log(pool.create());


app.get("/*any", serveStatic("/", { middlewareMode: "bao" }));

const server = app.listen({ port: 3000 });
console.log(`Listening on http://localhost:${server.port}`);
