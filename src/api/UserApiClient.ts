import { BaseApiClient } from './BaseApiClient';

export class UserApiClient extends BaseApiClient {
  getUser(): string {
    return 'user';
  }
}
