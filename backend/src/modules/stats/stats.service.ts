import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class StatsService {
    constructor(private readonly eventEmitter: EventEmitter2, private readonly logger: Logger) {}

    @OnEvent('cache.invalidated')
    handleCacheInvalidated() {
        this.logger.log('Cache invalidated event received');
    }
}
