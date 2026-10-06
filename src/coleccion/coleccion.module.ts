import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Coleccion } from './coleccion.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { ColeccionService } from './coleccion.service';
import { ColeccionController } from './coleccion.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Coleccion, Usuario, Juego])],
  providers: [ColeccionService],
  controllers: [ColeccionController],
})
export class ColeccionModule {}
