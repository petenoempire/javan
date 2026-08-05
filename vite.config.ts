import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "cloudflare-module",
  },
  vite: {
    plugins: [mcpPlugin()],
    resolve: {
      alias: {
        "h3-v2": "h3",
      },
    },
    ssr: {
      // Bundle the server routing stack so the deployed worker never tries to
      // resolve these transitive packages at runtime.
      noExternal: [
        '@tanstack/react-start',
        '@tanstack/react-router',
        '@tanstack/router-core',
        '@tanstack/react-store',
        '@tanstack/history',
        'h3-v2',
        'h3',
        'rou3',
        'srvx',
      ],
    },
  },
});
