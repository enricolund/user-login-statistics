import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import { MyConfiguration } from '../MyConfiguration';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.cacheManager.set(key, value, MyConfiguration.CACHE_TTL_MS());
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
