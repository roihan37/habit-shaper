import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      APP_TIMEZONE: "Asia/Jakarta",
      AUTH_SECRET: "test-auth-secret-value",
      FRONTEND_URL: "http://localhost:3000",
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
    ],
  },
})
