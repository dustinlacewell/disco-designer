import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://disco.ldlework.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
