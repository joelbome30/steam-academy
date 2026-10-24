# Medición del visor en Moto G05

Este proyecto aún no tiene un resultado medido en un Moto G05. El navegador de escritorio usado para la comprobación local renderiza WebGL por software, así que su FPS no representa el rendimiento del teléfono.

1. Conecta el Moto G05 (Android 16) y el computador a la misma red. Desde la raíz del proyecto ejecuta `python -m http.server 5500 --bind 0.0.0.0` y abre `http://IP-DEL-COMPUTADOR:5500/` en Chrome del teléfono. También puedes usar `adb reverse tcp:5500 tcp:5500` y abrir `http://localhost:5500/` en el teléfono.
2. Abre `chrome://inspect/#devices` en el computador y selecciona la pestaña del sitio. Espera a que desaparezca el indicador de carga y deja el visor visible. Desactiva el ahorro de batería y evita que el teléfono se caliente antes de empezar.
3. En la consola remota ejecuta `__robotBenchmark.reset()`. Sin tocar la pantalla ni desplazar la página, espera 30 segundos y ejecuta `__robotBenchmark()`. Repite con giros táctiles continuos y luego tras varios minutos de uso para comprobar el rendimiento sostenido.
4. Registra `fps`, `meanMs`, `p95Ms`, `over33ms`, `dpr`, `css` y `canvas`, junto con versión de Chrome, temperatura aproximada y si el visor estaba quieto o en movimiento. Comprueba que `canvas` corresponda a `css × dpr` (con redondeo a píxeles enteros). El objetivo es al menos 30 FPS sostenidos y tiempo medio de cuadro de hasta 33,3 ms.

La utilidad mide el intervalo entre cuadros entregados por PlayCanvas. Incluye tiempo de CPU, GPU y espera de presentación, pero no separa el costo de GPU. Para diagnosticar cuellos de botella usa Performance y WebGL en Chrome DevTools del teléfono. No extrapoles FPS de la emulación de escritorio al Moto G05.
