import { generateHash } from '../util/security.js';

export class Share {
  constructor(
    public id: number,
    public name: string,
    public password: string | null,
    public reference: string,
  ) {}

  getAuthToken() {
    if (!this.password) {
      return null;
    }

    return generateHash(`${this.reference}${this.password}`);
  }

  validatePassword(password: string): boolean {
    return generateHash(password) === this.password;
  }
}
