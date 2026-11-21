import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: {
      mode: "on",
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
    video: 'on',
  },
  webServer: [
    {
      command: "npm run dev:server",
      url: "http://localhost:3000/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev:client",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
