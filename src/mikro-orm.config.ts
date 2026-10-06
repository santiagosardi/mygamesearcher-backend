import 'reflect-metadata';
import 'dotenv/config';
import { defineConfig } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { Genero } from './genero/genero.entity';
import { Plataforma } from './plataforma/plataforma.entity';
import { Caracteristica } from './caracteristica/caracteristica.entity';
import { Juego } from './juego/juego.entity';

export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  entities: [Genero, Plataforma, Caracteristica, Juego],
  metadataProvider: ReflectMetadataProvider,
  extensions: [Migrator],
  migrations: {
    pathTs: 'src/migrations',
    path: 'dist/migrations',
  },
});
