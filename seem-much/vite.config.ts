import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  server: {
    proxy: {
      "/agente": "http://localhost:3000",
      "/agentes": "http://localhost:3000",
      "/procesar": "http://localhost:3000",
      "/documento": "http://localhost:3000",
      "/reprocesar": "http://localhost:3000",
    },
  },
});
