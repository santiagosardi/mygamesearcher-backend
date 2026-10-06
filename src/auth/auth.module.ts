import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Usuario } from '../usuario/usuario.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature([Usuario]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret?.trim()) {
          throw new Error(
            'Falta configurar JWT_SECRET en las variables de entorno',
          );
        }
        return { secret, signOptions: { expiresIn: '1h' } };
      },
    }),
  ],
  providers: [PasswordService, AuthService, JwtAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [PasswordService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
