# Almacenamiento local

Dexie abre IndexedDB `VentaFacil`, versión 1. La calculadora usa solamente la tabla `settings`, registro `global`, para guardar el porcentaje de IVA en puntos base (`1900` = 19%). Si no existe, se crea con el valor inicial.

El esquema versión 1 conserva las tablas históricas `products`, `categories`, `customers`, `quotes`, `quoteItems`, `followUps`, `priceLists` y `activityLog`. La interfaz actual no las usa ni muestra. Se mantienen para no borrar datos existentes de instalaciones anteriores. No se crean nuevos registros en esas tablas.

Una futura eliminación de esas tablas requiere una migración Dexie explícita y una decisión sobre los datos previos.
