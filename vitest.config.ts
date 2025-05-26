import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist_backup/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
    ],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    reporters: ["default", "html"],
    outputFile: "html/index.html",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
