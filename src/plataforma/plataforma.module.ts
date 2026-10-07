import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Plataforma } from './plataforma.entity';
import { PlataformaService } from './plataforma.service';
import { PlataformaController } from './plataforma.controller';

@Module({
  imports: [AuthModule, MikroOrmModule.forFeature([Plataforma])],
  providers: [PlataformaService],
  controllers: [PlataformaController],
})
export class PlataformaModule {}
