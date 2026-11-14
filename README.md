# Calculadora Comercial

Aplicación de precios para Android y web, en español y pesos chilenos. Incluye calculadoras de IVA, descuentos, margen sobre el costo, cantidades, precio objetivo y comparativos; calculadora simple, catálogo de productos, notas, agenda y recordatorios de próximos pedidos.

Los importes se calculan en pesos enteros. El IVA inicial es 19 % y se puede cambiar en Ajustes. Los datos se guardan en el dispositivo con Dexie y se pueden exportar e importar mediante un respaldo local. La app funciona sin conexión después de instalarse.

## Desarrollo web

Requisitos: Node.js y npm recientes.

```powershell
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

`npm run build` genera `dist/`, que no se guarda en Git. La versión web también es una PWA.

## Android

Requisitos: Java 21 y Android SDK configurado. Tras compilar la web:

```powershell
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

El APK de depuración queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Los APK generados no se guardan en este repositorio. En el equipo de desarrollo original se conservan en `versiones/`.

La clave usada para actualizar las instalaciones anteriores permanece **solo en el equipo original** (`.toolchains/android-user/debug.keystore`) y está excluida de Git. En otro equipo, Gradle usa su clave de depuración local; ese APK tendrá una firma distinta y no actualizará directamente una instalación firmada con la clave original.

## Estructura

- `src/pages/`: pantallas de la app.
- `src/utils/money.ts`: cálculos monetarios puros.
- `src/db/database.ts`: almacenamiento local y esquema histórico de Dexie.
- `src/data/initialProducts.json`: catálogo inicial de precios.
- `tests/`: pruebas automatizadas.
- `android/`: proyecto nativo de Capacitor.

No hay servidor ni sincronización de cuentas. Los recordatorios del teléfono requieren permiso de notificaciones. El respaldo es local; cada usuario decide si lo comparte.
