import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MyConfiguration } from '../MyConfiguration';
import { UserLoginCreate } from '../modules/user-logins/user-login.interface';
import { UserLoginService } from '../modules/user-logins/user-login.service';

@Injectable()
export class GenerateUserLoginData {
  constructor(private readonly userLoginService: UserLoginService) {}
  private readonly logger = new Logger(GenerateUserLoginData.name);

  private generateOne(): UserLoginCreate {
    const loginTime = faker.date.recent({ days: 30 });
    const logoutTime = faker.datatype.boolean(0.8)
      ? faker.date.between({ from: loginTime, to: new Date() })
      : null;

    const sessionDuration = logoutTime
      ? Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000)
      : null;

    return {
      user_id: faker.number.int({ min: 1, max: 1000 }),
      login_time: loginTime.toISOString(),
      logout_time: logoutTime ? logoutTime.toISOString() : null,
      session_duration_seconds: sessionDuration,
      ip_address: faker.internet.ip(),
      region: faker.location.country(),
      device_type: faker.helpers.arrayElement(['Desktop', 'Mobile', 'Tablet']),
      browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']),
    };
  }

  /**
   * Generate multiple fake user login records
   */
  @Cron(`*/${MyConfiguration.FAKE_DATA_IMPORT_INTERVAL_SECONDS()} * * * * *`)
  async generateMany(): Promise<void> {
    const count = MyConfiguration.FAKE_DATA_COUNT();
    this.logger.log(`Generating ${count} user login records`);
    await this.userLoginService.createUserLogins(
      Array.from({ length: count }, () => this.generateOne()),
    );
  }
}
