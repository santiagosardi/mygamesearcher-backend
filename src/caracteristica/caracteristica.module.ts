import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Caracteristica } from './caracteristica.entity';
import { CaracteristicaService } from './caracteristica.service';
import { CaracteristicaController } from './caracteristica.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Caracteristica])],
  providers: [CaracteristicaService],
  controllers: [CaracteristicaController],
})
export class CaracteristicaModule {}
