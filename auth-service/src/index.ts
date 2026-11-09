import { app } from "./app.js";
import { initSigningKey } from "./keys/signing-key.js";
import { logger } from "./logger.js";

const PORT = Number(process.env.PORT) || 4000;

try {
  initSigningKey();
  app.listen(PORT, () => logger.info({ port: PORT }, "Auth service started"));
} catch (err) {
  logger.fatal({ err }, "Signing key initialization failed");
  process.exit(1);
}
