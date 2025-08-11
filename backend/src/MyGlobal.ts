import dotenv from 'dotenv';
import { Singleton } from 'tstl';
import typia from 'typia';

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

    NODE_ENV: 'development' | 'production' | 'test';

    STATS_BROADCAST_INTERVAL_SECONDS: `${number}`;
    CACHE_TTL_MINUTES: `${number}`;

    FAKE_DATA_COUNT: `${number}`;
    FAKE_DATA_IMPORT_INTERVAL_SECONDS?: `${number}`;

    WS_PATH: string;
    WS_EVENT_NAME: string;

    CORS_ORIGINS?: string;
  }
}

const environments = new Singleton(() => {
  dotenv.config();
  return typia.assert<MyGlobal.IEnvironments>(process.env);
});
