import { defineConfig } from "vinxi";
import { tanstackStart } from "@tanstack/start-vite-plugin";

export default defineConfig({
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public",
      base: "/",
    },
    {
      name: "client",
      type: "spa",
      handler: "./src/entry-client.tsx",
      target: "browser",
      plugins: () => [tanstackStart()],
    },
    {
      name: "ssr",
      type: "http",
      handler: "./src/entry-server.tsx",
      target: "server",
    }
  ]
});
