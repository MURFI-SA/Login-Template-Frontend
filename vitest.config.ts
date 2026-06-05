import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./client/src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["client/src/**/*.ts", "client/src/**/*.tsx"],
      exclude: [
        "client/src/main.tsx",
        "client/src/App.tsx",
        "client/src/vite-env.d.ts",
        "client/src/test/**",
        "client/src/**/__tests__/**",
        "client/src/components/ui/**",
        "client/src/components/ThemeToggleButton.tsx",
        "client/src/contexts/ThemeContext.tsx",
        "client/src/components/ErrorBoundary.tsx",
        "client/src/hooks/useComposition.ts",
        "client/src/pages/NotFound.tsx",
        "client/src/types/**",
        "client/src/lib/trpc.ts"
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
