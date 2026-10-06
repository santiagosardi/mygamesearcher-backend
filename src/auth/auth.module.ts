import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Usuario } from '../usuario/usuario.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Usuario])],
  providers: [PasswordService, AuthService],
  controllers: [AuthController],
  exports: [PasswordService],
})
export class AuthModule {}
