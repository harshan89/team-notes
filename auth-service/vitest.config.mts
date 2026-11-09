import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // Throwaway key for tests, never touches keys/private.pem
      JWT_PRIVATE_KEY_PATH: join(tmpdir(), `auth-service-test-${process.pid}`, "private.pem"),
      LOG_LEVEL: "silent",
    },
  },
});
