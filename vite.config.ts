import { resolve } from "node:path";
import { build as buildWithEsbuild } from "esbuild";
import { defineConfig, type Plugin } from "vite";

function contentScriptClassicBundle(): Plugin {
  return {
    name: "chatjumper-content-classic-bundle",
    apply: "build",
    async closeBundle() {
      await buildWithEsbuild({
        entryPoints: [resolve(__dirname, "src/content/index.ts")],
        outfile: resolve(__dirname, "dist/content.js"),
        bundle: true,
        format: "iife",
        platform: "browser",
        target: "es2022",
        minify: true,
        sourcemap: false,
        logLevel: "silent"
      });
    }
  };
}

export default defineConfig({
  plugins: [contentScriptClassicBundle()],
  publicDir: "public",
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        options: resolve(__dirname, "src/options/index.ts"),
        popup: resolve(__dirname, "src/popup/index.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
