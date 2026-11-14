# Plan del producto

## Alcance actual

Calculadora local de precios para Chile: IVA, descuentos, margen aplicado sobre el costo neto o total con IVA, cantidades con precio unitario neto después del descuento, comparación de productos por total por kilo y calculadora de operaciones básicas. Campos numéricos vacíos al inicio, modos claro y oscuro de alto contraste, uso sin conexión, versión web PWA y APK Android instalable.

## Criterios de calidad

- Pesos enteros y porcentajes en puntos base; redondear al peso.
- Navegación y controles legibles en pantallas de 320 px, 390 px, tablet y escritorio.
- Ajustes de IVA y apariencia persistentes en el dispositivo.
- `npm run typecheck`, `npm test`, `npm run build` y `assembleDebug` correctos.
- Prueba final en teléfono Android físico pendiente de realizar por el usuario.
