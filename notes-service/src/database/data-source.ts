import "reflect-metadata";
import { DataSource } from "typeorm";
import { Note } from "../entity/Note";

// Real database (file on disk).
const MainDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_PATH ?? "src/database/notes.sqlite",
  synchronize: true,
  entities: [Note],
});

// Fresh, empty in-memory database for tests.
export const TestDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  entities: [Note],
});

// The data source the app uses. Vitest sets NODE_ENV=test,
// so under tests the app talks to TestDataSource.
export const AppDataSource = process.env.NODE_ENV === "test" ? TestDataSource : MainDataSource;
