# Backend E2E aislado

Esta infraestructura utiliza una base descartable y credenciales exclusivas.
Debe estar completamente aislada de producción; nunca apuntar estos comandos a la
base Aiven de producción ni reutilizar sus credenciales.

## Preparación manual, cuando se autorice

1. Crear manualmente `mygamesearcher_e2e` en una instancia MySQL descartable,
   preferentemente separada de desarrollo. Crear un usuario MySQL exclusivo con
   permisos únicamente sobre esa base. No reutilizar el usuario de desarrollo.
2. Copiar `.env.e2e.example` a `.env.e2e` (ignorado por Git) y reemplazar placeholders:
   `DB_USER`, `DB_PASS`, `JWT_SECRET` y `E2E_ADMIN_PASSWORD`. Configurar host/puerto
   de esa instancia. Mantener NODE_ENV=e2e, PORT=3001 y DB_NAME=mygamesearcher_e2e.
3. El ADMIN E2E debe usar email `@example.test`. No usar el ADMIN de desarrollo.
4. Para autorizar reset o seed, configurar `E2E_ALLOW_DB_RESET=YES` en ese archivo.

## Comandos

Desde la raíz del backend:

```sh
npm run e2e:db:reset
npm run start:e2e
```

`reset` comprueba configuración y base efectiva con SELECT DATABASE(), elimina
las tablas del esquema E2E (incluida la de migraciones), aplica las migraciones
existentes y carga catálogo + fixtures + ADMIN. No crea ni elimina bases MySQL.
Usarlo antes de cada ejecución para no depender de datos anteriores.

```sh
npm run e2e:db:seed
```

`seed` requiere esquema ya migrado; no lo limpia. Reutiliza el catálogo existente
y crea tres juegos ficticios: `E2E Juego base`, `E2E Juego candidato 1` y
`E2E Juego candidato 2`, con atributos compartidos para producir recomendaciones.
Reutiliza PasswordService y el bootstrap ADMIN; actualiza su hash si ya existe.
Los USER se registran mediante los propios tests. Los IDs no forman parte del contrato.

Cada comando compila primero. El arranque E2E no aplica migraciones ni seeds.
`npm run seed`, `start` y `start:dev` mantienen su significado habitual.

## Aislamiento

Solo se lee `.env.e2e`, sin fallback al `.env` normal ni a credenciales heredadas.
ConfigModule también desactiva la lectura del `.env` en modo E2E.
El guard exige NODE_ENV, nombre exacto de base, puerto y origen; las operaciones
de escritura requieren además E2E_ALLOW_DB_RESET=YES. Se comprueba también
el destino ORM y la base efectiva de MySQL antes de reset/seed.
Los errores no imprimen credenciales, hashes ni JWT_SECRET.

El backend escucha en 3001 y admite CORS únicamente desde
http://127.0.0.1:5174 y http://localhost:5174. Fuera de E2E, CORS usa
FRONTEND_ORIGIN, con fallback a http://localhost:5173.

## Integración con el frontend

Los flujos Playwright se trabajan en el [repositorio frontend](https://github.com/santiagosardi/mygamesearcher-frontend).
Su configuración y estado deben consultarse allí. Desde la raíz de este backend,
el comando para iniciar el servicio aislado es:

```sh
npm run start:e2e
```

La URL de disponibilidad es http://127.0.0.1:3001. Al integrar un runner del
frontend, verificar el aislamiento y evitar reutilizar un servidor de otro entorno.

## Jest y entorno aislado

`npm test` ejecuta las pruebas Jest del backend: la validación final registrada
es de 14 suites y 174 tests aprobados. No son pruebas Playwright.

`npm run test:e2e` ejecuta la configuración Jest de `test/jest-e2e.json` y su
prueba HTTP de `GET /`. Importa AppModule, pero el comando no establece por sí
solo NODE_ENV=e2e ni prepara la base aislada. No equivale a `e2e:db:reset`,
`e2e:db:seed` ni `start:e2e`; confirmar el entorno antes de ejecutarlo.

## Verificaciones permitidas sin MySQL

```sh
npm run build
npm run lint
npm test
```
