import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    if (bcrypt.truncates(password)) {
      throw new BadRequestException('La contraseña no puede superar 72 bytes');
    }
    return bcrypt.hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    if (bcrypt.truncates(password)) {
      return false;
    }
    return bcrypt.compare(password, hash);
  }
}
