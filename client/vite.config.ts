import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

const clientDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, clientDirectory, "");
  const port = Number(env.VITE_CLIENT_PORT || 5173);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("VITE_CLIENT_PORT must be an integer between 1 and 65535.");
  }

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        "/api": env.VITE_SERVER_URL || "http://localhost:3000",
      },
    },
  };
});
