import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Usuario } from '../usuario/usuario.entity';
import { Biblioteca } from '../biblioteca/biblioteca.entity';
import { Juego } from '../juego/juego.entity';
import { Coleccion } from '../coleccion/coleccion.entity';
import { RecomendacionService } from './recomendacion.service';
import { RecomendacionController } from './recomendacion.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Usuario, Biblioteca, Juego, Coleccion])],
  providers: [RecomendacionService],
  controllers: [RecomendacionController],
})
export class RecomendacionModule {}
