import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Biblioteca } from './biblioteca.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { BibliotecaService } from './biblioteca.service';
import { BibliotecaController } from './biblioteca.controller';

@Module({
  imports: [
    AuthModule,
    MikroOrmModule.forFeature([Biblioteca, Usuario, Juego]),
  ],
  providers: [BibliotecaService],
  controllers: [BibliotecaController],
})
export class BibliotecaModule {}
