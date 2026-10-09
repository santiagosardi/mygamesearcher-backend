# API MyGameSearcher

## 1. Información general

El backend NestJS expone una API REST. Los cuerpos de solicitudes y las respuestas de recursos utilizan JSON. `GET /` devuelve texto y los DELETE exitosos no devuelven contenido.

- URL local habitual: `http://localhost:3000`.
- URL de producción: `https://mygamesearcher-backend.onrender.com`.
- No existe prefijo global `/api`.
- Para enviar un body JSON: `Content-Type: application/json`.
- Para las rutas protegidas:

```http
Authorization: Bearer <accessToken>
```

Esta referencia describe 40 endpoints de 10 controllers. Está basada en el código; los ejemplos son ficticios, no respuestas capturadas de producción.

## 2. Convenciones HTTP

| Método | Uso | Estado exitoso actual |
| --- | --- | --- |
| GET | Lectura | 200 |
| POST | Creación; login autentica | 201 por defecto; `/auth/login` declara 200 |
| PATCH | Actualización parcial | 200 |
| DELETE | Eliminación | 200 con body vacío; no hay `@HttpCode(204)` |

| Error | Significado |
| --- | --- |
| 400 | Validación, propiedades no admitidas o parámetros inválidos |
| 401 | Credenciales o autenticación inválidas |
| 403 | Rol insuficiente |
| 404 | Recurso inexistente; también recurso personal ajeno |
| 409 | Conflicto traducido explícitamente por el servicio |
| 500 | Error interno no controlado; no todo error de persistencia se convierte en 409 |

El `ValidationPipe` global usa `whitelist`, `forbidNonWhitelisted` y `transform`: los campos adicionales en un DTO generan 400. Todos los `:id` usan `ParseIntPipe`, que rechaza valores no enteros; no hay una validación adicional explícita de positividad en esos parámetros path.

En las tablas siguientes, los errores indicados son adicionales a estas reglas comunes:

- Rutas JWT: pueden devolver 401.
- Rutas ADMIN: pueden devolver 401 o 403.
- Body/query DTO inválido o `:id` no entero: 400.
- Cualquier operación puede fallar por un error interno no controlado.
- `—` significa que no se declara otro error de negocio específico.

## 3. Autenticación y roles

Registro crea un usuario activo con rol USER y contraseña hasheada mediante bcryptjs. Devuelve el usuario público, sin token. Login devuelve `{ user, accessToken }`. El JWT contiene `sub`, `email` y `rol`, y expira en una hora.

`JwtAuthGuard` verifica el Bearer token, la firma, expiración y estructura del payload; luego consulta que el usuario exista y esté activo. La identidad y el rol utilizados corresponden al usuario actual de la base. `RolesGuard` comprueba el rol requerido.

### USER

Puede autenticarse, consultar `/auth/me`, gestionar su biblioteca y sus colecciones y obtener recomendaciones. Las lecturas del catálogo también son públicas.

### ADMIN

Tiene acceso a lo anterior y además gestiona usuarios y crea, modifica y elimina juegos, géneros, plataformas y características.

Biblioteca y Colecciones siempre obtienen el propietario del JWT. No aceptan `usuarioId` del cliente, ni en body ni como filtro query. ADMIN también opera sobre sus propios recursos personales en esas rutas. Un recurso ajeno se responde como 404.

## 4. Endpoints

Acceso: **Público** no exige token; **JWT** acepta USER o ADMIN autenticado; **ADMIN** exige token y ese rol. Los nombres de DTO remiten a la sección 5 y las respuestas a la sección 6.

### Auth

Fuente: [AuthController](../src/auth/auth.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | Público | RegisterDto | Registrar usuario USER activo | 201 Usuario público | 409 email existente; 400 password supera 72 bytes |
| POST | `/auth/login` | Público | LoginDto | Autenticar | 200 `{ user, accessToken }` | 401 credenciales inválidas, usuario inactivo o sin hash |
| GET | `/auth/me` | JWT | Ninguno | Consultar identidad actual | 200 Usuario público | — |

### Usuarios

Fuente: [UsuarioController](../src/usuario/usuario.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/usuarios` | ADMIN | Ninguno | Listar usuarios | 200 Usuario[] | — |
| GET | `/usuarios/:id` | ADMIN | Path id | Consultar usuario | 200 Usuario | 404 usuario inexistente |
| POST | `/usuarios` | ADMIN | CreateUsuarioDto | Crear usuario sin contraseña | 201 Usuario | 409 email duplicado |
| PATCH | `/usuarios/:id` | ADMIN | Path id; UpdateUsuarioDto | Editar usuario | 200 Usuario | 404; 409 email duplicado |
| DELETE | `/usuarios/:id` | ADMIN | Path id | Eliminar usuario | 200 vacío | 404 |

### Juegos

Fuente: [JuegoController](../src/juego/juego.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/juegos` | Público | Ninguno | Listar catálogo completo | 200 Juego[] con relaciones | — |
| GET | `/juegos/:id` | Público | Path id | Consultar detalle | 200 Juego con relaciones | 404 |
| POST | `/juegos` | ADMIN | CreateJuegoDto | Crear juego | 201 Juego | 400 IDs relacionados inexistentes |
| PATCH | `/juegos/:id` | ADMIN | Path id; UpdateJuegoDto | Editar juego y relaciones | 200 Juego con relaciones | 404; 400 IDs relacionados inexistentes |
| DELETE | `/juegos/:id` | ADMIN | Path id | Eliminar juego | 200 vacío | 404 |

### Géneros

Fuente: [GeneroController](../src/genero/genero.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/generos` | Público | Ninguno | Listar géneros | 200 Genero[] | — |
| GET | `/generos/:id` | Público | Path id | Consultar género | 200 Genero | 404 |
| POST | `/generos` | ADMIN | CreateGeneroDto | Crear género | 201 Genero | 409 nombre encontrado previamente |
| PATCH | `/generos/:id` | ADMIN | Path id; UpdateGeneroDto | Editar género | 200 Genero | 404 |
| DELETE | `/generos/:id` | ADMIN | Path id | Eliminar género | 200 vacío | 404 |

### Plataformas

Fuente: [PlataformaController](../src/plataforma/plataforma.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/plataformas` | Público | Ninguno | Listar plataformas | 200 Plataforma[] | — |
| GET | `/plataformas/:id` | Público | Path id | Consultar plataforma | 200 Plataforma | 404 |
| POST | `/plataformas` | ADMIN | CreatePlataformaDto | Crear plataforma | 201 Plataforma | 409 nombre encontrado previamente |
| PATCH | `/plataformas/:id` | ADMIN | Path id; UpdatePlataformaDto | Editar plataforma | 200 Plataforma | 404 |
| DELETE | `/plataformas/:id` | ADMIN | Path id | Eliminar plataforma | 200 vacío | 404 |

### Características

Fuente: [CaracteristicaController](../src/caracteristica/caracteristica.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/caracteristicas` | Público | Ninguno | Listar características | 200 Caracteristica[] | — |
| GET | `/caracteristicas/:id` | Público | Path id | Consultar característica | 200 Caracteristica | 404 |
| POST | `/caracteristicas` | ADMIN | CreateCaracteristicaDto | Crear característica | 201 Caracteristica | 409 nombre encontrado previamente |
| PATCH | `/caracteristicas/:id` | ADMIN | Path id; UpdateCaracteristicaDto | Editar característica | 200 Caracteristica | 404 |
| DELETE | `/caracteristicas/:id` | ADMIN | Path id | Eliminar característica | 200 vacío | 404 |

En estos tres recursos, PATCH no traduce explícitamente una colisión de nombre a 409. POST verifica previamente el nombre, pero tampoco captura una colisión concurrente al persistir. No se garantiza 409 para toda violación UNIQUE.

### Biblioteca

Fuente: [BibliotecaController](../src/biblioteca/biblioteca.controller.ts). Todas sus rutas reciben PersonalQueryDto vacío: no admiten filtros query.

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/bibliotecas` | JWT | Sin query | Listar entradas propias | 200 Biblioteca[] | — |
| GET | `/bibliotecas/:id` | JWT | Path id; sin query | Consultar entrada propia | 200 Biblioteca | 404 inexistente o ajena |
| POST | `/bibliotecas` | JWT | CreateBibliotecaDto; sin query | Agregar juego a biblioteca propia | 201 Biblioteca | 404 usuario/juego; 409 juego ya agregado |
| PATCH | `/bibliotecas/:id` | JWT | Path id; UpdateBibliotecaDto; sin query | Editar estado/favorito | 200 Biblioteca | 404 inexistente o ajena |
| DELETE | `/bibliotecas/:id` | JWT | Path id; sin query | Quitar entrada propia | 200 vacío | 404 inexistente o ajena |

### Colecciones

Fuente: [ColeccionController](../src/coleccion/coleccion.controller.ts). Todas sus rutas reciben PersonalQueryDto vacío.

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/colecciones` | JWT | Sin query | Listar colecciones propias | 200 Coleccion[] | — |
| GET | `/colecciones/:id` | JWT | Path id; sin query | Consultar colección propia | 200 Coleccion | 404 inexistente o ajena |
| POST | `/colecciones` | JWT | CreateColeccionDto; sin query | Crear colección propia | 201 Coleccion | 404 usuario; 400 juegos inexistentes; 409 nombre duplicado para el usuario |
| PATCH | `/colecciones/:id` | JWT | Path id; UpdateColeccionDto; sin query | Editar colección propia | 200 Coleccion | 404 inexistente o ajena; 400 juegos inexistentes; 409 nombre duplicado |
| DELETE | `/colecciones/:id` | JWT | Path id; sin query | Eliminar colección propia | 200 vacío | 404 inexistente o ajena |

### Recomendaciones

Fuente: [RecomendacionController](../src/recomendacion/recomendacion.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/recomendaciones` | JWT | RecomendacionQueryDto: coleccionId opcional; sin body | Recomendar para el usuario autenticado | 200 RespuestaRecomendaciones | 400 query inválido; 404 usuario o colección inexistente/ajena |

### Raíz

Fuente: [AppController](../src/app.controller.ts).

| Método | Ruta | Acceso | Body / Params | Descripción | Respuesta | Errores propios |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/` | Público | Ninguno | Disponibilidad básica | 200 texto `Hello World!` | — |

## 5. DTOs y validaciones

En los PATCH, omitir un campo conserva su valor. No se exige al menos un campo: un objeto vacío no está expresamente prohibido. `transform: true` no implica convertir automáticamente todos los valores del body al tipo correcto.

### Usuarios y autenticación

Fuente: [DTOs de Usuario](../src/usuario/dto) y [DTOs de Auth](../src/auth/dto).

| DTO | Campos aceptados y validaciones |
| --- | --- |
| CreateUsuarioDto | `nombre` requerido: string, no vacío ni solo espacios, máximo 100. `apellido` opcional: string, máximo 100. `email` requerido: string, email válido, máximo 254; trim y lowercase. |
| UpdateUsuarioDto | Los mismos tres campos, todos opcionales y con las mismas validaciones. |
| RegisterDto | Hereda CreateUsuarioDto y agrega `password` requerido: string no vacío, mínimo 8 caracteres. PasswordService rechaza más de 72 bytes con 400. |
| LoginDto | `email` requerido: string, email válido, máximo 254, trim/lowercase. `password` requerido: string no vacío; no hay mínimo 8 en este DTO. Si supera 72 bytes, la comparación devuelve false y el login responde 401. |

Los DTOs de Usuario no aceptan password, passwordHash, rol, activo ni fechaCreacion. `POST /usuarios` crea con rol USER, activo true y hash null; no equivale al registro autenticable mediante contraseña.

### Juegos

Fuente: [CreateJuegoDto](../src/juego/dto/create-juego.dto.ts) y [UpdateJuegoDto](../src/juego/dto/update-juego.dto.ts).

| Campo | Create | Validación |
| --- | --- | --- |
| `titulo` | Requerido | String no vacío, máximo 255; no hay trim ni rechazo explícito de solo espacios |
| `descripcion` | Opcional | String |
| `fechaLanzamiento` | Opcional | String con patrón YYYY-MM-DD y fecha estricta válida |
| `desarrollador` | Opcional | String, máximo 255 |
| `urlImagen` | Opcional | String, URL HTTP/HTTPS con protocolo obligatorio, máximo 2048 |
| `generoIds` | Opcional | Array de enteros positivos sin duplicados |
| `plataformaIds` | Opcional | Array de enteros positivos sin duplicados |
| `caracteristicaIds` | Opcional | Array de enteros positivos sin duplicados |

UpdateJuegoDto admite los mismos campos, todos opcionales. El servicio verifica que existan los IDs relacionados; si faltan, devuelve 400.

Para cada relación en PATCH: omitir el array conserva la colección, `[]` la vacía y un array con IDs la reemplaza completamente. En create, una relación omitida queda vacía.

### Géneros, plataformas y características

Fuentes: [DTOs de Género](../src/genero/dto), [Plataforma](../src/plataforma/dto) y [Característica](../src/caracteristica/dto).

| DTOs | Campos y validaciones |
| --- | --- |
| CreateGeneroDto / CreatePlataformaDto / CreateCaracteristicaDto | `nombre` requerido: string no vacío. `descripcion` opcional: string. |
| UpdateGeneroDto / UpdatePlataformaDto / UpdateCaracteristicaDto | `nombre` y `descripcion` opcionales: string. El nombre vacío no está expresamente rechazado en estos Update. |

No hay MaxLength ni trim en estos DTOs. `IsOptional` omite validaciones también para null; no implica que cualquier null pueda persistirse en una columna obligatoria. Las restricciones de base no sustituyen validaciones DTO ni garantizan un error 400.

### Biblioteca

Fuente: [DTOs de Biblioteca](../src/biblioteca/dto).

- CreateBibliotecaDto: `juegoId` requerido, entero positivo; `estado` opcional, enum; `favorito` opcional, boolean real, no string.
- UpdateBibliotecaDto: únicamente `estado` y `favorito`, opcionales y con las mismas validaciones.
- Estados: `PENDIENTE`, `JUGANDO`, `COMPLETADO`, `ABANDONADO`.
- Defaults: estado PENDIENTE y favorito false.
- No se acepta usuarioId; en update tampoco juegoId.

### Colecciones

Fuente: [DTOs de Colección](../src/coleccion/dto).

- CreateColeccionDto: `nombre` requerido, string con trim, no vacío, máximo 100; `descripcion` opcional string; `juegoIds` opcional, array de enteros positivos sin duplicados.
- UpdateColeccionDto: los mismos campos, todos opcionales, conservando las validaciones.
- Los juegos deben existir. En create, omitir juegoIds crea una colección vacía. En PATCH, omitir conserva, `[]` vacía y un array con IDs reemplaza los juegos.
- El nombre debe ser único para el propietario. No se acepta usuarioId ni fechaCreacion.

### Query y null

- [RecomendacionQueryDto](../src/recomendacion/dto/recomendacion-query.dto.ts): solo `coleccionId` opcional; se convierte a número y exige entero positivo. El servicio además exige entero seguro.
- [PersonalQueryDto](../src/auth/dto/personal-query.dto.ts): vacío. Rechaza usuarioId y cualquier filtro adicional en las rutas de Biblioteca/Colecciones.
- En Usuario, Juego, Biblioteca y Coleccion los campos opcionales usan `ValidateIf(value !== undefined)`: omitir está permitido, pero null no saltea las validaciones de tipo. No hay un contrato de borrado de campos simples mediante null.

## 6. Respuestas de recursos

Las respuestas CRUD son entidades serializadas por MikroORM, no DTOs de salida independientes. Los campos opcionales pueden carecer de valor; no se debe suponer que siempre contienen información.

| Recurso | Campos principales |
| --- | --- |
| Usuario / Usuario público | `id`, `nombre`, `apellido`, `email`, `rol`, `activo`, `fechaCreacion`. Nunca se incluye passwordHash: está oculto en la entidad y excluido de la proyección pública de Auth. |
| Juego | `id`, `titulo`, `descripcion`, `fechaLanzamiento`, `desarrollador`, `urlImagen`, `generos`, `plataformas`, `caracteristicas`. GET carga las tres relaciones explícitamente. |
| Genero / Plataforma / Caracteristica | `id`, `nombre`, `descripcion` |
| Biblioteca | `id`, `usuario`, `juego`, `estado`, `favorito`, `fechaAgregado`. Las lecturas cargan usuario y juego. |
| Coleccion | `id`, `nombre`, `descripcion`, `usuario`, `juegos`, `fechaCreacion`. Las lecturas cargan usuario y juegos. |
| RespuestaRecomendaciones | `usuarioId`, `recomendaciones` como array de `{ juego, puntaje, motivos }`, y `mensaje` opcional. Los juegos cargan sus tres clasificaciones. |

Biblioteca/Colecciones no solicitan mediante populate las clasificaciones anidadas de sus juegos: no se garantiza el mismo nivel de detalle que GET /juegos/:id. Las fechas Date se serializan como strings; fechaLanzamiento es una fecha representada como string.

## 7. Ejemplos ficticios

Los IDs son ilustrativos: deben existir en el entorno utilizado. Los ejemplos no deben ejecutarse automáticamente contra producción. La contraseña mostrada es solo un dato ficticio de documentación y `<jwt>` es un placeholder.

### Registro

`POST /auth/register`, Content-Type application/json:

```json
{
  "nombre": "Persona de ejemplo",
  "apellido": "Demo",
  "email": "persona@example.test",
  "password": "ClaveFicticia123!"
}
```

Respuesta ilustrativa, 201:

```json
{
  "id": 1,
  "nombre": "Persona de ejemplo",
  "apellido": "Demo",
  "email": "persona@example.test",
  "rol": "USER",
  "activo": true,
  "fechaCreacion": "2026-01-01T12:00:00.000Z"
}
```

### Login

`POST /auth/login`, Content-Type application/json:

```json
{
  "email": "persona@example.test",
  "password": "ClaveFicticia123!"
}
```

Respuesta ilustrativa, 200:

```json
{
  "user": {
    "id": 1,
    "nombre": "Persona de ejemplo",
    "apellido": "Demo",
    "email": "persona@example.test",
    "rol": "USER",
    "activo": true,
    "fechaCreacion": "2026-01-01T12:00:00.000Z"
  },
  "accessToken": "<jwt>"
}
```

### Crear juego como ADMIN

`POST /juegos`, con Content-Type application/json y Bearer de un ADMIN:

```json
{
  "titulo": "Aventura de ejemplo",
  "descripcion": "Exploración de un mundo ficticio",
  "fechaLanzamiento": "2025-05-20",
  "desarrollador": "Estudio de ejemplo",
  "urlImagen": "https://example.com/portada.png",
  "generoIds": [1],
  "plataformaIds": [1],
  "caracteristicaIds": [1]
}
```

Respuesta exitosa: 201 con el juego creado. Los tres IDs relacionados deben existir.

### Agregar juego a biblioteca

`POST /bibliotecas`, con Content-Type application/json y Bearer:

```json
{
  "juegoId": 1,
  "estado": "PENDIENTE",
  "favorito": true
}
```

Respuesta exitosa: 201 con la entrada creada. El propietario se toma del token; repetir el mismo juego para ese usuario produce 409.

### Crear colección

`POST /colecciones`, con Content-Type application/json y Bearer:

```json
{
  "nombre": "Para explorar",
  "descripcion": "Selección personal de ejemplo",
  "juegoIds": [1, 2]
}
```

Respuesta exitosa: 201 con la colección creada. Ambos juegos deben existir.

### Obtener recomendaciones

Con Bearer, sin body:

```http
GET /recomendaciones
Authorization: Bearer <jwt>
```

Para utilizar una colección propia:

```http
GET /recomendaciones?coleccionId=3
Authorization: Bearer <jwt>
```

Ejemplo de respuesta 200 si la biblioteca está vacía y no se seleccionó colección:

```json
{
  "usuarioId": 1,
  "recomendaciones": [],
  "mensaje": "No hay suficiente información: la biblioteca está vacía"
}
```

Cuando existen resultados, cada entrada contiene un juego, su puntaje y motivos como `Comparte género RPG: +6`.

## 8. Recomendaciones determinísticas

Se usa el usuario autenticado. Sin coleccionId, las preferencias se construyen desde toda su biblioteca; con coleccionId, desde una colección propia. Los favoritos de biblioteca pesan 2 y los demás juegos de referencia pesan 1.

El puntaje suma 3 por el peso acumulado de cada género coincidente, 2 por cada característica y 1 por cada plataforma. Se excluyen todos los juegos presentes en biblioteca y, si se utiliza una colección, también los juegos de esa colección.

Solo se devuelven puntajes positivos, hasta 10 resultados, ordenados por puntaje descendente y por ID de juego ascendente en empate. Los motivos explican los aportes. No utiliza IA ni persiste recomendaciones.

Una biblioteca vacía, colección vacía o ausencia de coincidencias devuelve 200 con recomendaciones vacías y mensaje. Una colección inexistente o ajena devuelve 404. Query inválido, incluidos campos adicionales, devuelve 400.

## 9. Consideraciones importantes

- POST /auth/register no devuelve token: para obtenerlo se utiliza login.
- POST /usuarios no equivale al registro y no recibe password.
- No hay endpoints de refresh token, logout, recuperación ni cambio de contraseña.
- GET /juegos no implementa filtros ni paginación en backend.
- Biblioteca y Colecciones derivan usuario del JWT; ADMIN no obtiene acceso a recursos personales ajenos mediante esas rutas.
- DELETE devuelve body vacío con 200; no declara 204.
- Los cuerpos con propiedades no permitidas generan 400 cuando se validan contra sus DTOs.
- Los parámetros :id usan ParseIntPipe, sin validación adicional explícita de positividad.
- No existe prefijo global /api.
- No se promete 409 para errores de persistencia que los servicios no controlan; tampoco se inventan validaciones ausentes en los DTOs.

Volver al [índice de documentación](./README.md).

