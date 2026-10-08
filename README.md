# MyGameSearcher - Backend

API REST de MyGameSearcher encargada de autenticación, reglas de negocio, recursos personales, recomendaciones y persistencia.

- [Backend desplegado](https://mygamesearcher-backend.onrender.com)
- [Frontend desplegado](https://mygamesearcher-frontend-fawn.vercel.app)
- [Repositorio backend](https://github.com/santiagosardi/mygamesearcher-backend)

## Integrantes

- Santiago Sardi
- Santino Ripacolli

## Funcionalidades

- Registro e inicio de sesión con autenticación JWT.
- Roles USER y ADMIN y protección de rutas administrativas.
- CRUD de juegos, géneros, plataformas y características.
- Biblioteca personal con estados PENDIENTE, JUGANDO, COMPLETADO y ABANDONADO.
- Favoritos y colecciones.
- Recomendaciones determinísticas y explicables, sin IA.
- Recursos personales asociados al usuario autenticado.

## Arquitectura

```text
React / Vercel
      ↓ HTTPS / API REST + JWT
NestJS / Render
      ↓ MikroORM / conexión SSL
MySQL / Aiven
```

Frontend y backend están separados y se comunican por HTTP mediante API REST, con HTTPS en producción. NestJS contiene la lógica de negocio; MikroORM gestiona la persistencia en MySQL alojado en Aiven.

## Tecnologías

- Backend: NestJS, TypeScript, MikroORM 7.2.3, mysql2, MySQL 8, JWT y bcryptjs.
- Testing del backend: Jest.
- Infraestructura: Render y Aiven MySQL.
- Frontend relacionado: React 19, TypeScript y Vite, desplegado en Vercel.

## Requisitos

- Node.js 24.x.
- npm.
- Una instancia MySQL disponible y una base creada para el proyecto.

## Instalación

```sh
git clone https://github.com/santiagosardi/mygamesearcher-backend.git
cd mygamesearcher-backend
npm ci
```

Copiar [.env.example](./.env.example) a `.env` y completar la configuración local. No versionar secretos. Aplicar las migraciones antes del primer arranque.

## Variables de entorno

| Variable | Uso |
|---|---|
| `NODE_ENV` | `development` en local y `production` en producción. |
| `PORT` | Puerto HTTP; fallback `3000`. |
| `DB_HOST` | Host MySQL. |
| `DB_PORT` | Puerto MySQL. |
| `DB_USER` | Usuario de la base. |
| `DB_PASS` | Contraseña; no se utiliza `DB_PASSWORD`. |
| `DB_NAME` | Nombre de la base. |
| `DB_SSL` | Normalmente `false` en local; `true` para Aiven. |
| `DB_SSL_CA` | CA de Aiven en PEM cuando corresponde; admite saltos reales o `\n`. |
| `JWT_SECRET` | Secreto obligatorio de JWT. No debe versionarse. |
| `FRONTEND_ORIGIN` | Origen exacto permitido por CORS; fallback `http://localhost:5173`. |

### Seed de administrador

`ADMIN_EMAIL` y `ADMIN_PASSWORD` son necesarios para ejecutar el seed. `ADMIN_NOMBRE` es opcional y usa `Administrador` por defecto; `ADMIN_APELLIDO` es opcional. Una nueva ejecución puede reutilizar el usuario y actualizar su contraseña.

### Entorno E2E

Consultar las variables y medidas de aislamiento en [la guía E2E](./e2e/README.md). Debe utilizar una base y credenciales separadas de producción.

## Ejecución local

Con la base disponible, migrada y configurada mediante `.env`:

```sh
npm run start:dev
```

## Scripts principales

| Comando | Función |
|---|---|
| `npm run start` | Arranque con Nest CLI. |
| `npm run start:dev` | Desarrollo con recarga. |
| `npm run build` | Compila a `dist/`. |
| `npm run start:prod` | Ejecuta el backend compilado. |
| `npm run lint` | ESLint con corrección automática. |
| `npm run format` | Aplica formato con Prettier. |
| `npm test` | Jest mediante Node con VM Modules. |
| `npm run test:watch` | Jest en modo watch. |
| `npm run test:cov` | Jest con cobertura. |
| `npm run migration:up:prod` | Aplica migraciones con configuración compilada. |
| `npm run seed` | Carga el catálogo desde TypeScript. |
| `npm run seed:admin` | Crea o actualiza el administrador. |
| `npm run start:e2e` | Compila y arranca el backend E2E aislado. |
| `npm run e2e:db:reset` | Reconstruye tablas y carga datos de la base E2E. |
| `npm run e2e:db:seed` | Carga datos sobre el esquema E2E migrado. |
| `npm run test:e2e` | Ejecuta la configuración E2E de Jest; no prepara el entorno aislado. |

Los scripts de watch y cobertura invocan Jest directamente y no incluyen el flag de VM Modules de `npm test`.

## Migraciones

```sh
npm run build
npm run migration:up:prod
```

Las migraciones crean o actualizan el esquema. El script utiliza `dist/mikro-orm.config.js` y apunta a la base configurada por variables de entorno, tanto en local como en producción. No se ejecutan automáticamente al iniciar la aplicación. Comprobar el destino antes de aplicarlas.

## Seeds

### Catálogo

```sh
npm run seed
```

Alternativa después de `npm run build`:

```sh
node dist/seed/seed.js
```

El catálogo final incluye 147 juegos, 13 géneros, 6 plataformas y 15 características. El seed procesa el catálogo dentro de una transacción. Reutiliza atributos por nombre y juegos por título, actualiza descripciones, conserva imágenes personalizadas existentes y completa imágenes ausentes cuando el catálogo tiene una URL. Agrega relaciones sin borrar las previas.

Es reutilizable en ejecuciones consecutivas. No garantiza evitar duplicados ante escrituras concurrentes, porque el título no es UNIQUE. Rechaza títulos que coincidan con varios juegos existentes.

### Administrador

```sh
npm run seed:admin
```

Alternativa después de compilar:

```sh
node dist/seed/seed-admin.js
```

Crea o reutiliza el usuario por email, lo activa, asigna ADMIN y actualiza su contraseña. Los seeds requieren el esquema migrado y no se ejecutan al iniciar NestJS. Consultar [la guía de seeds](./src/seed/README.md).

## Testing

Jest se utiliza para las pruebas del backend. La validación final registrada es de **14 suites y 174 tests aprobados** mediante `npm test`.

La infraestructura E2E aislada es independiente. Los flujos Playwright fueron trabajados desde el repositorio frontend; los 174 tests no corresponden a Playwright. `npm run test:e2e` no sustituye la preparación del entorno aislado. Consultar [la guía E2E](./e2e/README.md).

## Deploy

Producción utiliza la rama `main`: [frontend en Vercel](https://mygamesearcher-frontend-fawn.vercel.app), [backend en Render](https://mygamesearcher-backend.onrender.com) y MySQL 8 en Aiven. Las migraciones están aplicadas y el catálogo final de 147 juegos, 13 géneros, 6 plataformas y 15 características está cargado.

Configuración actual de Render, build:

```sh
npm ci --include=dev && npm run build
```

Start:

```sh
npm run start:prod
```

Render ejecuta NestJS y Aiven aloja MySQL. `DB_SSL=true` y `DB_SSL_CA` configuran SSL con validación del certificado. `FRONTEND_ORIGIN` permite únicamente el origen configurado del frontend en modo normal. `GET /` devuelve `Hello World!` como comprobación básica de disponibilidad; no consulta la base en esa petición.

## Frontend

- [Repositorio frontend](https://github.com/santiagosardi/mygamesearcher-frontend).
- [Aplicación frontend](https://mygamesearcher-frontend-fawn.vercel.app).

Consultar también el [índice de documentación](./docs/README.md).
