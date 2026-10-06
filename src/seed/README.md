# Seed manual del catálogo

Ejecutar desde la raíz del proyecto, con las variables `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASS` y `DB_NAME` de la configuración actual (`.env`):

```sh
npm run seed
```

No se ejecuta al iniciar NestJS. Usa `ts-node` y MikroORM ya instalados, sin
dependencias adicionales ni migraciones. Incluye exactamente 50 juegos;
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
lanzamiento, desarrollador ni imagen. Los juegos nuevos dejan esos campos
opcionales sin valor. Géneros, plataformas y características existentes
conservan sus nombres y descripciones.

No elimina registros ni asigna IDs. No escribe en Usuario, Biblioteca, Coleccion
ni coleccion_juego. Elden Ring y The Witcher 3 se reutilizan por título, de modo
que las referencias de biblioteca y colecciones siguen apuntando a los mismos
juegos. Una segunda ejecución reutiliza los 50 juegos y las mismas relaciones.

El resumen diferencia juegos creados de actualizados/reutilizados; esta última
cifra no implica que todos hayan requerido un UPDATE. Los errores se imprimen,
el proceso termina con código distinto de cero y la conexión se cierra.

Los tests del seed usan memoria y no abren conexiones MySQL. Comprueban catálogo,
reutilización, conservación de relaciones y rechazo de títulos ambiguos; no
sustituyen una validación de transacciones y pivotes contra una base de pruebas.
