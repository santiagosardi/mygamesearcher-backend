import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeneroModule } from './genero/genero.module';
import { PlataformaModule } from './plataforma/plataforma.module';
import { CaracteristicaModule } from './caracteristica/caracteristica.module';
import { JuegoModule } from './juego/juego.module';
import { UsuarioModule } from './usuario/usuario.module';
import { BibliotecaModule } from './biblioteca/biblioteca.module';
import { ColeccionModule } from './coleccion/coleccion.module';
import { RecomendacionModule } from './recomendacion/recomendacion.module';
import mikroOrmConfig from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MikroOrmModule.forRoot(mikroOrmConfig),

    GeneroModule,
    PlataformaModule,
    CaracteristicaModule,
    JuegoModule,
    UsuarioModule,
    BibliotecaModule,
    ColeccionModule,
    RecomendacionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
