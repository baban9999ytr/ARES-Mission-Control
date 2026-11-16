import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4187",
    browserName: "chromium",
    launchOptions: { executablePath: "/usr/bin/chromium" },
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "PORT=4187 npm run dev",
    url: "http://127.0.0.1:4187",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
