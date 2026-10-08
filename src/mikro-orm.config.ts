import 'reflect-metadata';
import './config/environment';
import { defineConfig } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { Genero } from './genero/genero.entity';
import { Plataforma } from './plataforma/plataforma.entity';
import { Caracteristica } from './caracteristica/caracteristica.entity';
import { Juego } from './juego/juego.entity';
import { Usuario } from './usuario/usuario.entity';
import { Biblioteca } from './biblioteca/biblioteca.entity';
import { Coleccion } from './coleccion/coleccion.entity';

export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  driverOptions:
    process.env.DB_SSL === 'true'
      ? {
          ssl: {
            ca: process.env.DB_SSL_CA?.replace(/\\n/g, '\n') || undefined,
            rejectUnauthorized: true,
          },
        }
      : {},
  entities: [
    Genero,
    Plataforma,
    Caracteristica,
    Juego,
    Usuario,
    Biblioteca,
    Coleccion,
  ],
  metadataProvider: ReflectMetadataProvider,
  extensions: [Migrator],
  migrations: {
    pathTs: 'src/migrations',
    path: 'dist/migrations',
  },
});
