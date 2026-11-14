# Verificación

- Versión 0.11.7 (27-10-2026): revisión de las 11 pantallas y utilidades; 54 pruebas correctas. 88 combinaciones de tema/ancho sin desbordamiento; contraste de textos visibles, cálculos, memoria por herramienta, edición/búsqueda/copia de notas y contactos, exportación/importación sin duplicados y archivo inválido comprobados. Las 11 rutas web cargaron con el servidor detenido. Ajustes compartidos evitan resultados temporales con IVA predeterminado; respaldo con límite consistente, menú/teclado, Inicio compacto y accesibilidad corregidos. Se añadieron y probaron siete botones finales de Limpiar datos. Typecheck, build, cap sync y assembleDebug correctos. APK código 42, versión 0.11.7 y firma original verificados. Detalle: audit/REVISION-0.11.7.md. Pendiente: instalación y funciones nativas en teléfono físico.

- Versión 0.11.6 (27-10-2026): precisión decimal conservada en operaciones encadenadas, errores de división recuperables sin perder operandos, resultados pequeños visibles y teclado corregido. Borradores en memoria ante fallos de almacenamiento con aviso visible, ajustes transaccionales y pantalla de recuperación. Android no usa el service worker web para evitar contenido antiguo al actualizar. 46 pruebas, typecheck, build, cap sync y assembleDebug correctos. Navegador: 17.563 × 1,19 ÷ 12,5 = 1.671,9976; persiste al navegar y recargar. Ajustes muestra 0.11.6. APK versionCode 41 y firma original verificados. npm audit --omit=dev: 0 vulnerabilidades; quedan 3 avisos moderados de desarrollo en uuid/xcode/Capacitor CLI cuya corrección automática propone degradación incompatible y no se aplicó. Pendiente: instalación y prueba física en teléfono.

- Versión 0.11.5 (23-10-2026): corregidos la edición de resultados pequeños, los paréntesis de operaciones secuenciales, la precisión de tasas con montos grandes y los límites de entrada/subtotal. Los borradores largos ya no se recortan. Los respaldos incluyen Calculadora y borradores de Notas/Agenda; validación extraída y reforzada, nombres de exportación únicos. Se evitan contactos vacíos y guardados simultáneos de notas/contactos; se informan errores de ajustes y portapapeles. Ajustes muestra la versión desde package.json, comprobada en navegador como 0.11.5. 42 pruebas, typecheck, build, sincronización y compilación Android correctos. APK versionCode 40; firma original verificada. Pendiente: instalación y prueba física en teléfono.

- Versión 0.11.4: la Calculadora guarda y recupera la operación pendiente y el resultado inmediato al cambiar de pantalla o reiniciar; `C` borra el estado. Notas y Agenda conservan borradores sin guardar al navegar y permiten limpiarlos. 36 pruebas correctas; `npm run typecheck`, `npm run build`, `npx cap sync android` y `assembleDebug` correctos. En navegador se comprobó `12 + 3 = 15` tras ir a IVA, volver y recargar; `C` dejó cero. También se comprobaron los borradores de Notas y Agenda tras navegar. APK `versionCode 39`, `versionName 0.11.4`, firma verificada con la huella SHA-256 anterior: `9acc6ae2ed695b93d5b6fd056dacc5dc88c958d208cbfdacabfb77b1eebb2d42`. Pendiente: prueba física en teléfono.

- Versión 0.11.3: Inicio ya no muestra «Tu espacio de precios»; accesos rápidos compactos con solo icono y título. Calculadora reemplaza Descuentos en esos accesos y en la barra inferior; Descuentos conserva su ruta, menú completo y pestaña. 32 pruebas correctas; `npm run typecheck`, `npm run build`, `npx cap sync android` y `assembleDebug` correctos. Navegación y resultado inmediato de Calculadora verificados en navegador; Inicio a 320 y 375 px sin desbordamiento horizontal. APK `versionCode 38`, `versionName 0.11.3`, firma verificada con la huella SHA-256 de 0.11.2: `9acc6ae2ed695b93d5b6fd056dacc5dc88c958d208cbfdacabfb77b1eebb2d42`. Pendiente: instalación y prueba física en teléfono.

- Versión 0.11.2: se retiraron Cartera, Hoy, Mis pedidos digitados y Facturas del día junto con sus rutas y componentes. Inicio rediseñado con accesos directos a los cálculos, Notas y Agenda. Se conservan las tablas históricas en Dexie y los respaldos anteriores para proteger los datos de instalaciones existentes. 32 pruebas correctas; `npm run typecheck`, `npm run build`, `npx cap sync android` y `assembleDebug` correctos. Inicio revisado a 320 × 640 y 375 × 844 px, sin desbordamiento horizontal. APK `versionCode 37`, `versionName 0.11.2`, firma verificada con la misma huella SHA-256 de 0.11.1: `9acc6ae2ed695b93d5b6fd056dacc5dc88c958d208cbfdacabfb77b1eebb2d42`. Pendiente: instalación y prueba física en teléfono.

- Versión 0.11.1: corrige la firma incompatible del APK 0.11.0. Se fija la clave de prueba original del proyecto en la compilación Android para evitar que se genere una nueva por accidente. 41 pruebas, compilación web, sincronización Android y compilación APK correctas. APK `versionCode 36`, `versionName 0.11.1`, firma v2 verificada y misma huella SHA-256 de firma que 0.10.21: `9acc6ae2ed695b93d5b6fd056dacc5dc88c958d208cbfdacabfb77b1eebb2d42`. El APK 0.11.0 incompatible fue retirado de `versiones/`.

- Versión 0.11.0: 41 pruebas correctas; `npm run typecheck`, `npm run build`, `npx cap sync android` y `assembleDebug` correctos. Se añadieron pruebas para totales de pedidos, vencimientos y CSV. El APK generado tenía una firma distinta de 0.10.x y Android lo rechazó como actualización; se retira ese archivo. La vista previa del navegador no pudo conectarse al servidor local en este entorno; pendiente: revisión visual e instalación en teléfono, en particular el menú móvil y las nuevas pantallas.

- Versión 0.10.21: 38 pruebas correctas, typecheck y build correctos. Se creó un cliente ficticio de Cartera y se exportó un respaldo JSON en navegador; se comprobó que incluye nombre, RUT, dirección, teléfono, día de visita y coordenadas, y que Ajustes indica 1 cliente antes y después de exportar. El archivo de prueba en Descargas se eliminó. Android sincronizado, APK con versionCode 34, versionName 0.10.21 y firma v2 verificados. Pendiente: prueba física en teléfono.

- Versión 0.10.20: 38 pruebas correctas, typecheck incluido en build y compilación web correctos. Icono proporcionado por el usuario verificado visualmente en formato normal y adaptable; recursos Android y PWA incluidos en APK. Sincronización Android y compilación correctas. APK con versionCode 33, versionName 0.10.20 y firma v2 verificados. Créditos retirados de Ajustes. Pendiente: prueba física en teléfono.

- Versión 0.10.19: 38 pruebas correctas, typecheck, build, sincronización Android y compilación correctos. Mapa y ficha de marcadores revisados en navegador móvil a 390 × 844 y 320 × 640 px, sin desbordamiento horizontal. Se comprobó que la visita elegida se conserva al salir de Hoy y volver. Icono de Flaticon generado para Android y PWA. APK con versionCode 32, versionName 0.10.19 y firma v2 verificados. Pendiente: prueba física en teléfono.

- Versión 0.10.18: 38 pruebas correctas, incluidos orden sugerido, RUT, coordenadas y división del recorrido en tramos. Typecheck y build correctos. Inicio revisado a 320 × 640 px: cuatro accesos visibles y sin desbordamiento horizontal. En navegador móvil se guardaron dos clientes de prueba, se comprobaron sus marcadores numerados en Hoy y se verificó que el día y el mapa siguen activos al salir y volver. Android sincronizado, APK 0.10.18 compilada y firma v2 verificada. Pendiente: prueba física en teléfono.

- Versión 0.10.17: Cartera independiente de Agenda, listado, búsqueda, edición, eliminación y filtro semanal en Hoy. Respaldo actualizado para conservar clientes de Cartera y admitir respaldos anteriores. 36 pruebas correctas; `npm run typecheck`, `npm run build`, `npx cap sync android` y compilación Android correctos. Firma APK v2 y versión 0.10.17 verificadas. Pendiente: prueba física en teléfono.

- Versión 0.10.16: 34 pruebas correctas; geocodificación manual, marcador y persistencia de ruta comprobados en navegador móvil de 390 px. Sin desbordamiento horizontal. Instalación física en teléfono pendiente.

- Versión 0.10.15: 31 pruebas correctas; cantidades decimales en comparativos y su persistencia verificadas. Inicio revisado en viewports móviles de 320 y 390 px, sin desbordes horizontales.

- Versión 0.10.14: ícono Android y PWA actualizado; resultado inmediato, copia y divisiones por cero cubiertos por pruebas.

- Versión 0.10.13: encabezado, título de Inicio y acciones mostaza revisados en ambos temas y a 320/390 px. Pruebas, tipos, build y APK firmada verificados.

- Versión 0.10.12: 29 pruebas correctas; tipos y build correctos. Sincronización Android y APK firmada verificadas.
- Vistas de 320, 390 y 768 px: Inicio, Comparativos, Margen y Calculadora revisadas en ambos temas; sin desbordes horizontales. Pendiente: instalación y prueba física en teléfono.

- Versión 0.10.11: 26 pruebas correctas; incluye envases y precio objetivo. Typecheck, build, sincronización y APK verificados para esta versión.
- Probar en el teléfono: guardar un cálculo en Historial y reutilizarlo; comparar una caja de 5 × 2500 g; compartir un resultado; exportar respaldo en Ajustes y localizarlo en Documentos.

- `npm run typecheck`: correcto.
- `npm test`: 24 pruebas correctas de operaciones básicas, persistencia de tres márgenes por modo, recuperación de comparativos antiguos, comparación por kilo y unidad, IVA, descuentos, cantidad, entradas numéricas, búsqueda y detalles de agenda.
- `npm run build`: correcto; PWA y archivos web generados.
- `android\gradlew.bat -p android assembleDebug`: correcto; APK de prueba generado.
- Vistas de 320 px, 390 px y 768 px: campos vacíos, agregar tercera opción, resultados y ausencia de desbordes horizontales comprobados.
- Pendiente: instalación y prueba física de los espacios de la barra de estado en el teléfono del usuario.

## Recompilar en esta máquina

```powershell
$env:JAVA_HOME = (Resolve-Path '.toolchains\jdk\jdk-21.0.12.1+1').Path
$env:ANDROID_HOME = (Resolve-Path '.toolchains\sdk').Path
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = (Resolve-Path '.toolchains\android-user').Path
$env:GRADLE_USER_HOME = (Join-Path (Resolve-Path '.').Path '.gradle-home')
npm run build
npx cap sync android
.\android\gradlew.bat -p android assembleDebug
```

El resultado de Gradle se genera en `android/app/build/outputs/apk/debug/app-debug.apk`; el archivo para instalar se guarda en `versiones/Venta-Facil-Precios-v0.12.5.apk` en el equipo original.
