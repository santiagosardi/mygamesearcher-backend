import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Juego } from './juego.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { JuegoService } from './juego.service';
import { JuegoController } from './juego.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Juego, Genero, Plataforma, Caracteristica]),
  ],
  providers: [JuegoService],
  controllers: [JuegoController],
})
export class JuegoModule {}
