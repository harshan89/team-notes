import { app } from "./app";
import { AppDataSource } from "./database/data-source";
import { logger } from "./logger";

const PORT = Number(process.env.PORT) || 3000;

AppDataSource.initialize()
  .then(() => {
    logger.info({ database: AppDataSource.options.database }, "Database initialized");
    app.listen(PORT, () => logger.info({ port: PORT }, "Note service started"));
  })
  .catch((err) => {
    logger.fatal({ err }, "Database initialization failed");
    process.exit(1);
  });
