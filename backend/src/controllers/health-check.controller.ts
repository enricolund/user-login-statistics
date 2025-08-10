import { Controller, Get } from '@nestjs/common';

import { HealthCheckService, IHealthStatus } from '../services/health-check.service';

@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  async getHealth(): Promise<IHealthStatus> {
    return await this.healthCheckService.checkHealth();
  }
}
