# Seed manual del catálogo

Ejecutar desde la raíz del proyecto, con las variables `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASS` y `DB_NAME` de la configuración actual (`.env`):

```sh
npm run seed
```

La base debe tener las migraciones aplicadas. En Aiven, configurar también
`DB_SSL=true` y `DB_SSL_CA` según el certificado del servicio.
Alternativa compilada, después de `npm run build`:

```sh
node dist/seed/seed.js
```

No se ejecuta al iniciar NestJS. Usa `ts-node` y MikroORM ya instalados, sin
dependencias adicionales ni migraciones. El catálogo incluye 147 juegos, 13 géneros, 6 plataformas y 15 características;
`catalogo.ts` contiene las clasificaciones y las ediciones seleccionadas.
Las plataformas no enumeran compatibilidad con generaciones anteriores.

La carga completa ocurre en una transacción. Busca atributos por `nombre`
(UNIQUE) y juegos por `titulo`, usando la comparación de MySQL. Si un título
coincide con más de un registro, aborta y revierte la carga. El título no tiene
UNIQUE en el esquema: ejecutar una sola instancia del seed a la vez, sin altas
simultáneas de esos títulos por el CRUD. La idempotencia corresponde a
ejecuciones consecutivas; no constituye una garantía frente a escrituras
concurrentes sin una restricción UNIQUE.

Para juegos existentes conserva ID y título, actualiza la descripción y agrega
las relaciones del catálogo sin quitar relaciones previas. No modifica fecha de
lanzamiento ni desarrollador. Conserva `urlImagen` si ya existe; cuando está
ausente y el catálogo proporciona una URL, la completa, también en juegos nuevos.
Los juegos nuevos dejan fecha de lanzamiento y desarrollador sin valor. Géneros, plataformas y características existentes
conservan sus nombres y descripciones.

No elimina registros ni asigna IDs. No escribe en Usuario, Biblioteca, Coleccion
ni coleccion_juego. Elden Ring y The Witcher 3 se reutilizan por título, de modo
que las referencias de biblioteca y colecciones siguen apuntando a los mismos
juegos. Una segunda ejecución reutiliza los juegos existentes del catálogo cuando los encuentra por título y conserva las relaciones existentes.

El resumen diferencia juegos creados de actualizados/reutilizados; esta última
cifra no implica que todos hayan requerido un UPDATE. Los errores se imprimen,
el proceso termina con código distinto de cero y la conexión se cierra.

Los tests del seed usan memoria y no abren conexiones MySQL. Comprueban catálogo,
reutilización, conservación de relaciones y rechazo de títulos ambiguos; no
sustituyen una validación de transacciones y pivotes contra una base de pruebas.

## Seed de administrador

Desde la raíz del proyecto:

```sh
npm run seed:admin
```

Alternativa después de `npm run build`:

```sh
node dist/seed/seed-admin.js
```

Requiere `ADMIN_EMAIL` y `ADMIN_PASSWORD`. `ADMIN_NOMBRE` es opcional y usa
`Administrador` por defecto; `ADMIN_APELLIDO` es opcional. No versionar credenciales.
La contraseña debe tener al menos 8 caracteres y no superar 72 bytes UTF-8.

Crea o reutiliza un usuario por email, lo activa y asigna el rol ADMIN dentro de
una transacción. Reejecutarlo actualiza su contraseña; no es una operación sin
efectos sobre una cuenta existente. No se ejecuta al arrancar NestJS.
