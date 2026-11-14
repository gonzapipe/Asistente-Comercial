# Registro de cambios

## 0.10.21 — Cartera en el respaldo local
- Ajustes muestra el número de clientes de Cartera que se incluirán en el respaldo.
- Al exportar e importar, la app confirma cuántos clientes contiene el archivo y cuántos se agregaron al dispositivo.
- Se conserva el formato de respaldo existente y la compatibilidad con archivos anteriores.

## 0.10.20 — Icono de la aplicación
- Se usa el icono proporcionado por el usuario para Android, PWA y favicon.
- Se retira la sección de créditos de Ajustes.

## 0.10.19 — Mapa de Hoy e icono
- Nuevo icono de calculadora de DinosoftLabs (Flaticon) para Android y PWA, con atribución en Ajustes.
- Inicio explica mejor las funciones principales.
- Hoy alterna entre lista y mapa de pantalla amplia, con marcadores numerados y ficha del cliente al tocarlos.
- El orden sugerido muestra la visita actual y permite avanzar una por una; «Cómo llegar» abre navegación directa al cliente seleccionado.
- Se retiraron los enlaces por tramos y se mantiene el día, la vista y la visita elegida al regresar a Hoy.

## 0.10.18 — Mapa diario y RUT
- Inicio tiene menos texto y accesos compactos en dos columnas para pantallas móviles.
- Cartera agrega RUT opcional y busca la ubicación de la dirección al guardar el cliente; el punto se puede corregir en Hoy.
- Hoy muestra los clientes del día en un mapa, sugiere un orden por cercanía y abre indicaciones en tramos para incluir todas las visitas.
- El día elegido y el estado del mapa se conservan al cambiar de menú o volver a abrir la app. El filtro de búsqueda y el punto de partida permanecen al navegar entre pantallas durante la sesión.

## 0.10.17 — Cartera y Hoy
- Ruta se retira de la navegación y del inicio. Cartera y Hoy son dos opciones nuevas e independientes de Agenda.
- Cartera guarda clientes con nombre, dirección, teléfono y día semanal de visita. Incluye búsqueda, edición, eliminación, llamada y acceso a mapas.
- Hoy muestra los clientes programados para el día actual y permite elegir otro día y buscar en sus visitas.
- Los clientes de Cartera se guardan localmente y se incluyen en respaldos nuevos. Se mantienen importables los respaldos anteriores y los datos históricos de Ruta.

## 0.10.16 — Ruta de visitas
- Nueva pantalla Ruta con visitas manuales o seleccionadas desde Agenda, mapa abierto, búsqueda explícita de direcciones y corrección de puntos tocando el mapa.
- Orden sugerido por cercanía, edición manual, estado visitado, copia de la lista y navegación externa por parada.
- La ruta se guarda en el dispositivo y se incluye en los respaldos. Los respaldos anteriores siguen siendo importables.
- El mapa y la búsqueda requieren internet; el orden y las paradas guardadas siguen disponibles sin conexión.

## 0.10.15 — marca GP y cantidades decimales
- Nuevo ícono original GP azul y dorado para Android, PWA y favicon, diseñado para la zona segura del ícono adaptable de Android.
- El encabezado usa GP y aumenta los tamaños de «CALCULADORA COMERCIAL» y su subtítulo en móvil.
- «Cantidad por caja» acepta hasta tres decimales; sus resultados usan «unidad de medida» para admitir kilos u otras magnitudes sin etiquetarlos como unidades enteras.

## 0.10.14 — ícono de calculadora y resultado inmediato
- Nuevo ícono azul de calculadora, coherente en Android, PWA y favicon.
- La calculadora muestra el resultado al escribir el segundo número, sin necesidad de pulsar «=»; la operación permanece visible arriba y «Copiar resultado» utiliza el valor actualizado.

## 0.10.13 — título comercial y acciones mostaza
- El encabezado visible ahora dice «CALCULADORA COMERCIAL» y el título principal de Inicio se destaca con mayor tamaño.
- «Limpiar datos» y «Copiar todos los resultados» usan un mostaza de alto contraste en modo oscuro y claro.
- El nombre instalable Android continúa como «Venta Fácil Precios» para mantener la identidad de la app.

## 0.10.12 — diseño azul y calculadoras más útiles
- Toda la interfaz adopta una paleta azul sobria en modo claro y oscuro, incluido el arranque de Android.
- Inicio retira el eslogan anterior y muestra el crédito «GONZACODEX».
- Se eliminan las acciones y la pantalla de Historial; los datos antiguos siguen conservados en el esquema local.
- Margen permite copiar y compartir juntos los 2 o 3 resultados calculados.
- Comparativos retira ejemplos de los campos, valida tamaños y totales, conserva opciones válidas si un registro local está dañado y elige el menor precio real antes de redondear el valor mostrado.
- Calculadora acepta teclado, porcentaje contextual, cambio de signo, edición del resultado y copia.

## 0.10.11 — historial, envases, precio objetivo y respaldo
- Historial de cálculos con búsqueda, reutilización, copia, compartir y eliminación.
- Comparativos por kilos permite ingresar unidades por caja y gramos por unidad; calcula automáticamente el peso de la caja.
- Precio objetivo calcula el neto, IVA, diferencia y porcentaje respecto a un costo neto o con IVA.
- Los resultados se pueden compartir con las opciones nativas de Android.
- Ajustes permite exportar un respaldo local JSON a Documentos e importar datos de respaldo.
- Se conservan las tablas y los datos de versiones anteriores.

## 0.10.10 — ejemplo de producto por cantidad
- En Comparativos → «Cantidad por caja», el campo Nombre del producto muestra «MARGARINA POTE QUALY ORIGINAL 12X500 GRS» como ejemplo.
- El ejemplo de «Kilos por caja» conserva su texto anterior.

## 0.10.9 — comparativos por kilos o unidades y tres márgenes
- Comparativos ofrece «Kilos por caja» y «Cantidad por caja», con precio neto y total por kilo o por unidad según corresponda.
- Cada modo conserva sus productos, permite agregar opciones, copiar detalles y limpiar solo sus propios datos.
- Los comparativos por kilos guardados en versiones anteriores se recuperan automáticamente.
- Margen acepta hasta tres porcentajes opcionales por tipo de costo y muestra resultados separados para cada porcentaje ingresado.
- Los tres porcentajes de cada tipo de costo se conservan al cambiar de pantalla o reiniciar la app.

## 0.10.8 — resumen de IVA y memoria de ambos modos de Margen
- IVA Neto → Total muestra Neto, IVA según la tasa configurada y Total con IVA como resultado principal.
- IVA Total → Neto muestra primero el Total con IVA ingresado, después el IVA y Total neto como resultado principal.
- Copiar resultado de IVA respeta el orden y los nombres visibles en cada dirección.
- Margen guarda costo y porcentaje independientemente para valor neto y valor con IVA; «Limpiar datos» afecta solo al modo visible.
- Los datos de Margen guardados por la versión anterior se recuperan en el modo que estaba seleccionado.

## 0.10.7 — datos persistentes en calculadoras
- IVA, Descuentos, Margen y Cantidades conservan los valores digitados al cambiar de opción o reiniciar la app.
- También se conserva la selección de cálculo de IVA y el tipo de costo de Margen.
- Se agrega «Limpiar datos» a estas cuatro calculadoras; el botón existente de Comparativos se mantiene.
- Limpiar borra los valores de la opción actual y guarda el estado vacío sin afectar las otras opciones.

## 0.10.6 — resumen de margen según el valor ingresado
- El campo de porcentaje se llama «Margen (%)» en ambos modos.
- La explicación muestra cómo se suma el porcentaje al costo neto o al total con IVA ingresado.
- Al ingresar un total con IVA, el resumen muestra el aumento total, el total original con IVA y el total con IVA y margen.
- Los detalles copiados usan los mismos valores y nombres que el resumen visible.

## 0.10.5 — barra de estado y resumen de margen
- Android usa márgenes nativos del sistema para ubicar la interfaz debajo de la barra de notificaciones.
- Margen con costo neto muestra aumento neto, total con IVA y margen, y neto con margen.
- Margen con costo con IVA muestra aumento neto, neto con margen, y total con IVA y margen.
- «Copiar resultado» incluye solamente esos datos visibles.

## 0.10.4 — accesos en tonos verdes
- Los accesos de Inicio usan dos tonos del verde de la marca: menta para Notas y verde profundo para Agenda.
- Se revisó el contraste de ambos botones en modos claro y oscuro.

## 0.10.3 — accesos de ancho completo
- El selector de cálculo vuelve a sus seis opciones originales.
- Inicio muestra debajo del cuadro principal los accesos de ancho completo a Notas y Agenda.
- Los accesos usan azul y violeta, con texto blanco y diseño adaptable al móvil.

## 0.10.2 — Inicio centrado y ocho opciones
- Inicio vuelve a mostrar solo el cuadro principal, ahora con su contenido centrado.
- El selector abierto desde «Empezar a calcular» incluye IVA, Descuentos, Margen, Cantidades, Comparativos, Calculadora, Notas y Agenda.
- Las ocho opciones se distribuyen en cuatro columnas en escritorio y dos en móvil; el selector también aparece en Notas y Agenda.

## 0.10.1 — accesos directos en Inicio
- Inicio muestra botones separados para Notas y Agenda debajo del cuadro principal.
- Los tres botones de Inicio tienen el mismo ancho y se alinean en pantallas móviles.
- La marca se presenta como «VENTA FÁCIL» con el subtítulo «Precios, cálculos, márgenes y más...».

## 0.10.0 — notas, agenda y modo claro gris
- Inicio acredita a GONZALO_CODEX.
- Notas permite guardar, editar, buscar mientras se escribe, copiar y eliminar apuntes.
- Agenda permite guardar, editar, buscar, copiar y eliminar contactos con campos opcionales.
- Ambos registros se guardan localmente en nuevas tablas Dexie, conservando el esquema histórico.
- El modo claro utiliza fondos y superficies gris claro con contraste revisado.

## 0.9.2 — comparativos persistentes
- La última comparación, con nombres, precios, kilos y opciones agregadas, se conserva al cambiar de sección y al volver a abrir la aplicación.
- «Limpiar datos» reinicia el comparativo con dos opciones vacías.

## 0.9.1 — operación visible en la calculadora
- La pantalla muestra los números y operadores mientras se digitan.
- Después de «=» conserva la operación completa encima del resultado.
- La expresión se adapta al ancho móvil y funciona en modos claro y oscuro.

## 0.9.0 — inicio simplificado y modos de apariencia
- Inicio muestra solo la caja principal con un botón de acceso más visible.
- Cada producto en Comparativos tiene su propio botón «Copiar detalles».
- Las etiquetas comerciales muestran «Total con IVA» y «Total por kilo».
- Ajustes permite elegir modo claro u oscuro y conserva la preferencia local.
- Colores y estados de botones revisados en ambos modos.

## 0.8.0 — precio por unidad y comparativos por kilo
- Cantidades muestra el precio unitario neto con descuento debajo del porcentaje ingresado.
- Comparativos permite nombre, total neto y kilos por caja para cada producto.
- Calcula total bruto, neto por kilo y bruto por kilo; compara por bruto por kilo.
- Pruebas del ejemplo de $17.563 netos y 12,5 kg.

## 0.7.0 — calculadora simple
- Nueva opción «Calculadora» en el menú, las pestañas y la pantalla principal.
- Teclado de suma, resta, multiplicación, división y decimales, con borrado y manejo de división por cero.
- Diseño adaptable a pantallas pequeñas y pruebas de operaciones básicas.

## 0.6.1 — texto y resultado móvil
- El desglose de costo neto muestra «IVA neto del precio final».
- El recuadro de resultado móvil separa la etiqueta del monto para evitar que el precio se parta.

## 0.6.0 — cálculo de margen sobre costo
- El porcentaje ahora se suma al costo, según el ejemplo comercial del usuario.
- Entrada alternativa de costo neto o costo total con IVA.
- Resultado principal neto o total según el tipo de entrada, con desglose de IVA.
- Pruebas de $1.000 netos y $1.190 con IVA al 50%.

## 0.5.0 — espacio para barras del sistema y crédito
- El encabezado y el menú móvil respetan el espacio de la barra de estado de Android.
- La barra inferior usa el espacio seguro de navegación.
- La pantalla principal acredita a Gonzalo Pérez.
- Los APK instalables se ordenan en `versiones/`.

## 0.4.0 — entrada numérica y comparativos ampliados
- Campos vacíos al inicio, con teclado numérico y validación de dígitos.
- Comparativos con opciones adicionales, eliminación de opciones y selección del menor precio.
- Simplificada la calculadora de margen para mostrar solo costo, utilidad, margen y precio.
- Nombre Android «Venta Fácil Precios» y APK versionado 0.4.0.
- Diseño móvil revisado a 320, 390 y 768 px.

## 0.3.0 — calculadora de precios y APK Android
- Navegación centrada en IVA, descuentos, margen, cantidades y comparativos.
- Interfaz gris oscuro, texto blanco y controles de alto contraste.
- Eliminados los módulos y archivos de venta rápida, productos, cotización, clientes y seguimiento.
- Proyecto Android con Capacitor y APK de prueba instalable.
- Ajustes reducidos al porcentaje de IVA; datos históricos locales conservados sin mostrarse.

## 0.2.0 — V1 local en prueba
- Cálculos monetarios centralizados y pruebas automatizadas.
- CRUD de productos y clientes; categorías, favoritos y listas personalizadas.
- Venta rápida con descuentos, totales, cliente y guardado transaccional.
- Historial de cotizaciones, estados, edición, duplicado, PDF, copia y WhatsApp.
- Seguimientos, inicio con datos reales, estadísticas, configuración y respaldo JSON.
- Diez productos, cinco clientes, cinco cotizaciones y cinco seguimientos demo iniciales.
- Carga diferida de módulos y ajustes de diseño móvil.

## 0.1.0 — Fase 1
- Estructura React + TypeScript + Vite y Tailwind.
- Navegación móvil y de escritorio con rutas para los nueve módulos.
- Base IndexedDB tipada y configuración inicial de Chile.
- Manifiesto, iconos y service worker para instalación y shell offline.
- Documentación del plan, esquema, pruebas y alcance.
