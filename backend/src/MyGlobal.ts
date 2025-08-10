import dotenv from "dotenv";
import { Singleton } from "tstl";
import typia from "typia";

/* eslint-disable */
export class MyGlobal {
  public static testing: boolean = false;
  public static get env(): MyGlobal.IEnvironments {
    return environments.get();
  }
}
export namespace MyGlobal {
  export interface IEnvironments {
    API_PORT: `${number}`;
    WS_PORT: `${number}`;
    
    DB_HOST: string;
    DB_PORT: `${number}`;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DATABASE_URL: string;
    
    NODE_ENV: "development" | "production" | "test";
    
    STATS_AGGREGATION_INTERVAL: `${number}`;
    CACHE_TTL_MINUTES: `${number}`;
    
    FAKE_DATA_COUNT: `${number}`;
    FAKE_DATA_IMPORT_INTERVAL_SECONDS?: `${number}`;
    DEFAULT_TOP_USERS_LIMIT: `${number}`;
    DEFAULT_LOGIN_TRENDS_DAYS: `${number}`;
    
    WS_PATH: string;
    
    RATE_LIMIT_MAX_REQUESTS?: `${number}`;
    RATE_LIMIT_WINDOW_MS?: `${number}`;
    CORS_ORIGINS?: string;
  }
}

const environments = new Singleton(() => {
  dotenv.config();
  return typia.assert<MyGlobal.IEnvironments>(process.env);
});
