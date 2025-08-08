import { faker } from '@faker-js/faker';
import { IUserLogin } from '../dto/user-login.dto';

export class GenerateUserLoginData {
  /**
   * Generate a single fake user login record
   */
  static generateOne(): IUserLogin.ICreate {
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
  static generateMany(count: number): IUserLogin.ICreate[] {
    return Array.from({ length: count }, () => this.generateOne());
  }

}
