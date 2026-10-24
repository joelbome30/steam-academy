# Migración local del visor 3D

## Implementación

- El visor de `script.js` ahora carga `robot-viewer.js`, que usa PlayCanvas Engine 2.23.3 local y WebGL2. El canvas y los controles HTML existentes permanecen intactos; `styles.css` no se modificó.
- El dispositivo usa `devicePixelRatio` real sin escala de renderizado ni resolución dinámica. Se desactiva MSAA para ahorrar ancho de banda a resolución nativa.
- `robot-fast.glb` sigue siendo el modelo principal y `robot.glb` el respaldo. El modelo principal ya estaba optimizado: 8 primitivas, 7 materiales, 4 texturas WebP pequeñas (dos de 512 × 512 y dos paletas de 256 × 4), 528.803 triángulos y 1.583.136 bytes. El original tiene 89 primitivas, 86 materiales, 1.017.744 triángulos y 43.272.164 bytes. Ambos GLB permanecen sin alteraciones.
- La escena usa materiales PBR del GLB, reflejos filtrados de un panorama de estudio procedural, luces key/fill/rim suaves y roughness mínimo equivalente a 0,24. Se desactiva la capa visible del cielo para conservar la cuadrícula original. Las sombras en tiempo real están desactivadas; el sitio conserva la sombra difusa existente. El GLB no incluye mapa de AO, así que no se añade una AO horneada sin modificar el arte original.
- El render solo se solicita cuando el visor está visible y hay movimiento o interacción, con objetivo de 30 cuadros por segundo. Se conserva pausa, movimiento reducido, botones de giro, arrastre táctil y respaldo estático ante fallo.
- Las bibliotecas Three.js usadas solo por el visor se eliminaron después de verificar la carga en PlayCanvas. Las licencias PlayCanvas MIT y Draco Apache 2.0 están en `vendor/`.

## Comparación visual

Capturas locales del mismo viewport de 1280 × 720: versión anterior en `/tmp/playcanvas-migration/before.png` y versión migrada en `/tmp/playcanvas-migration/after-neutral.png`. En ambas se conserva el encuadre, los colores, la silueta, los cables y la cuadrícula. La versión migrada muestra reflejos de estudio más definidos y un ligero cambio de contraste y saturación en las ruedas amarillas. La valoración de calidad visual en el Moto G05 requiere inspección en su pantalla física.

## Comprobación y rendimiento

- `node --check script.js` y `node --check robot-viewer.js`: correctos.
- Chromium local, escritorio 1280 × 720: GLB cargado, WebGL2 activo y canvas de 681 × 470 píxeles para 681 × 470 CSS con DPR 1.
- Chromium local, viewport móvil 412 × 915 con DPR 2,25: GLB cargado, WebGL2 activo y canvas de 832 × 562 píxeles para 370 × 250 CSS. La diferencia de medio píxel de ancho responde al redondeo.
- Los eventos reales de ratón para arrastrar y el botón de giro terminaron sin errores de página.
- Con renderizado WebGL por software, una muestra local de 14,51 s después de cargar el modelo entregó 17 intervalos: 1,17 FPS, 853,73 ms de media y 942,10 ms p95. Este dato mide SwiftShader en el computador, no el Moto G05. La medición sostenida en ese dispositivo está pendiente. `BENCHMARK.md` explica cómo obtener FPS, tiempo medio y p95 reales desde Chrome remoto.

## Riesgos pendientes

- El objetivo de al menos 30 FPS sostenidos y 33,3 ms por cuadro no puede confirmarse sin un Moto G05 físico.
- El modelo principal conserva 528.803 triángulos. Si el teléfono no alcanza el objetivo, conviene perfilar primero GPU y CPU en Chrome DevTools y luego evaluar un LOD simplificado con comparación visual.
- El renderizador local de Chromium reportó MSAA desactivado; esto coincide con la configuración de rendimiento. La nitidez final debe revisarse a la densidad nativa del teléfono.

## Diff

`git diff` muestra las modificaciones de archivos rastreados; `git status --short` incluye además `robot-viewer.js`, `BENCHMARK.md`, este informe y los nuevos archivos de PlayCanvas/Draco. No se hizo commit, push ni despliegue.
