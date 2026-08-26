import { defineConfig, devices } from "@playwright/test";

const apiPort = Number(process.env.PLAYWRIGHT_TODO_API_PORT ?? 4174);
const webPort = Number(process.env.PLAYWRIGHT_TODO_WEB_PORT ?? 5173);
const appRoot = process.cwd();
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: `${process.execPath} ${appRoot}/local-api/server.mjs`,
      cwd: appRoot,
      url: `http://127.0.0.1:${apiPort}/api/health`,
      env: {
        TODO_API_PORT: String(apiPort),
        TODO_WEB_ORIGIN: `http://127.0.0.1:${webPort}`
      },
      reuseExistingServer,
      timeout: 30_000
    },
    {
      command: `${process.execPath} ${appRoot}/node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${webPort}`,
      cwd: appRoot,
      url: `http://127.0.0.1:${webPort}/todos`,
      env: {
        VITE_TODO_API_BASE: `http://127.0.0.1:${apiPort}/api`
      },
      reuseExistingServer,
      timeout: 30_000
    }
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
