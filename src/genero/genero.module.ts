import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Genero } from './genero.entity';
import { GeneroService } from './genero.service';
import { GeneroController } from './genero.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Genero])],
  providers: [GeneroService],
  controllers: [GeneroController],
})
export class GeneroModule {}
