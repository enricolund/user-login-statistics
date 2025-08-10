import fs from "fs";
import path from "path";

import { MyGlobal } from "./MyGlobal";

export namespace MyConfiguration {
  // Server Configuration
  export const API_PORT = () => Number(MyGlobal.env.API_PORT);
  export const WS_PORT = () => Number(MyGlobal.env.WS_PORT);
  export const WS_PATH = () => MyGlobal.env.WS_PATH;
  export const WS_EVENT_NAME = () => MyGlobal.env.WS_EVENT_NAME || 'message';
  
  // Database Configuration
  export const DB_HOST = () => MyGlobal.env.DB_HOST;
  export const DB_PORT = () => Number(MyGlobal.env.DB_PORT);
  export const DB_USER = () => MyGlobal.env.DB_USER;
  export const DB_PASSWORD = () => MyGlobal.env.DB_PASSWORD;
  export const DB_NAME = () => MyGlobal.env.DB_NAME;
  export const DATABASE_URL = () => MyGlobal.env.DATABASE_URL;
  
  // Application Configuration
  export const NODE_ENV = () => MyGlobal.env.NODE_ENV;
  export const IS_DEVELOPMENT = () => NODE_ENV() === "development";
  export const IS_PRODUCTION = () => NODE_ENV() === "production";
  export const IS_TEST = () => NODE_ENV() === "test";
  
  // Stats and Caching Configuration
  export const STATS_BROADCAST_INTERVAL_SECONDS = () => Number(MyGlobal.env.STATS_BROADCAST_INTERVAL_SECONDS || 60);
  export const CACHE_TTL_MS = () => Number(MyGlobal.env.CACHE_TTL_MINUTES) * 60 * 1000;
  
  // Default Values Configuration
  export const FAKE_DATA_COUNT = () => Number(MyGlobal.env.FAKE_DATA_COUNT);
  export const FAKE_DATA_IMPORT_INTERVAL_SECONDS = () => Number(MyGlobal.env.FAKE_DATA_IMPORT_INTERVAL_SECONDS || 30);
  export const DEFAULT_TOP_USERS_LIMIT = () => Number(MyGlobal.env.DEFAULT_TOP_USERS_LIMIT);
  export const DEFAULT_LOGIN_TRENDS_DAYS = () => Number(MyGlobal.env.DEFAULT_LOGIN_TRENDS_DAYS);

  // Rate Limiting Configuration
  export const RATE_LIMIT_MAX_REQUESTS = () => Number(MyGlobal.env.RATE_LIMIT_MAX_REQUESTS || 100);
  export const RATE_LIMIT_WINDOW_MS = () => Number(MyGlobal.env.RATE_LIMIT_WINDOW_MS || 60000);
  
  // CORS Configuration
  export const CORS_ORIGINS = () => MyGlobal.env.CORS_ORIGINS || 'http://localhost:3000';

  export const ROOT = (() => {
    const split: string[] = __dirname.split(path.sep);
    return split.at(-1) === "src" && split.at(-2) === "bin"
      ? path.resolve(__dirname + "/../..")
      : fs.existsSync(__dirname + "/.env")
        ? __dirname
        : path.resolve(__dirname + "/..");
  })();
}
