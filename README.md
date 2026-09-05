# STEAM Academy — rediseño en progreso

Esta versión continúa en desarrollo y todavía no debe considerarse un diseño terminado ni aprobado.

## Objetivo y restricciones

Mejorar la presentación de https://www.steamacademy.com.co/ usando como inspiración el proyecto de Joel. Reutilizar los textos de la página original, sin inventar textos comerciales, testimonios, estadísticas ni información de cursos.

La primera propuesta fue rechazada. Esta segunda propuesta cambia la composición, introduce un robot 3D interactivo y combina secciones oscuras y claras. El enlace `http://127.0.0.1:5500/` se proporcionó para revisar el resultado local, no como referencia de diseño.

## Qué está implementado

- Portada con tipografía grande, colores carbón y verde lima y robot 3D con Three.js.
- Robot que flota, parpadea y sigue el cursor; luces y geometría generadas por código.
- Cuatro cursos con ilustraciones SVG, edades y descripciones del sitio original.
- Fotografías de la comunidad procedentes de la web original.
- Desplegables con los textos originales de metodología.
- Sección de experiencia gratuita y enlaces de contacto.
- Menú móvil, estilos adaptables, indicadores de foco y preferencia de movimiento reducido.
- Ilustración CSS de respaldo cuando la escena 3D no está disponible.
- Dependencias de Three.js guardadas localmente en `vendor/`, con su licencia MIT.

## Qué falta

- [ ] Revisar y aprobar visualmente esta segunda propuesta con el usuario. La primera propuesta fue rechazada; esta aún no tiene aprobación.
- [ ] Repetir la revisión final de escritorio y móvil después de los últimos ajustes al robot, las fotografías y el favicon.
- [ ] Verificar la carga de todas las fotografías, incluidas las de carga diferida, y que la consola no registre errores. La primera pasada detectó un recurso 404; después se añadió un favicon, pero falta confirmar la revisión completa.
- [ ] Comprobar visualmente la alternativa sin WebGL y la recuperación tras pérdida del contexto gráfico.
- [ ] Revisar navegación completa por teclado, lectores de pantalla, contraste y funcionamiento sin JavaScript.
- [ ] Probar rendimiento y uso de memoria en un móvil real; las comprobaciones realizadas hasta ahora fueron en Chromium con tamaños de pantalla emulados.
- [ ] Revisar los enlaces externos y confirmar destinos específicos de Game Developer y Developer Junior. Actualmente dirigen a la sección de experiencia; la portada oficial consultada no ofrecía enlaces específicos coherentes.
- [ ] Revisar la cobertura del contenido original: se utiliza una selección de sus secciones. Preguntas frecuentes y parte de los resultados no se trasladaron a esta propuesta. Cualquier contenido que se añada debe proceder del sitio original.
- [ ] Confirmar el flujo definitivo de inscripción. Actualmente se enlaza al formulario oficial; este proyecto no recibe datos ni registra inscripciones.
- [ ] Definir el despliegue cuando el diseño esté aprobado. Subir el código a GitHub no sustituye ni actualiza el dominio oficial de Steam Academy.

## Verificación realizada hasta ahora

En la primera revisión automatizada de esta segunda propuesta:

- La escena 3D cargó en Chromium (`scene-ready`).
- No se detectó desbordamiento horizontal en escritorio, 390 px ni 320 px.
- El menú móvil abrió y se cerró al navegar a Cursos.
- Se comprobó la apertura de un desplegable de metodología.
- El navegador reconoció la preferencia de movimiento reducido.
- Se revisaron capturas de escritorio, móvil y página completa.
- `node --check script.js` pasó después de los últimos cambios de JavaScript.

Estas comprobaciones no equivalen a una validación final. Las tareas pendientes están enumeradas arriba.

## Cómo abrir el proyecto

Abrir esta carpeta con Live Server y visitar la dirección que indique, por ejemplo:

```text
http://127.0.0.1:5500/
```

También se puede ejecutar desde la carpeta del proyecto:

```sh
python -m http.server 5500
```

No se requiere instalar paquetes ni compilar. Para cargar el módulo 3D se debe servir por HTTP; al abrir `index.html` directamente como archivo puede utilizarse únicamente la ilustración de respaldo.

## Archivos

- `index.html`: contenido, navegación y secciones.
- `styles.css`: diseño, adaptación a pantallas y robot de respaldo.
- `script.js`: menú móvil y escena 3D.
- `assets/`: logotipo y fotografías. `estudiantes.png` pertenece a la primera propuesta y ya no se utiliza.
- `vendor/`: Three.js 0.174.0 y su licencia.

Las fuentes se cargan desde Google Fonts, con alternativa del sistema. El logotipo, las fotografías y los textos proceden de https://www.steamacademy.com.co/; la licencia MIT incluida corresponde únicamente a Three.js.
