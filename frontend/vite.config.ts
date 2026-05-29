import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const chatApiTarget = env.CHAT_API_TARGET;

  return {
    plugins: [react()],
    server: {
      proxy: chatApiTarget
        ? {
            "/api/mcp": {
              target: chatApiTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});
