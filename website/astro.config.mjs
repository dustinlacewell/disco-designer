import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

// The editor island imports the bot's dependency-free domain + schema (single source of
// truth). Alias @disco → ../src and let Vite read outside the website package root.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const discoSrc = fileURLToPath(new URL("../src", import.meta.url));

export default defineConfig({
  site: "https://disco.ldlework.com",
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@disco": discoSrc,
      },
    },
    server: {
      fs: {
        allow: [repoRoot],
      },
    },
  },
});
