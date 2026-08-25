import { defineConfig, devices } from "@playwright/test";

const apiPort = 4174;
const webPort = 5173;
const appRoot = process.cwd();

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
        TODO_API_PORT: String(apiPort)
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: `${process.execPath} ${appRoot}/node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${webPort}`,
      cwd: appRoot,
      url: `http://127.0.0.1:${webPort}/todos`,
      env: {
        VITE_TODO_API_BASE: `http://127.0.0.1:${apiPort}/api`
      },
      reuseExistingServer: !process.env.CI,
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
