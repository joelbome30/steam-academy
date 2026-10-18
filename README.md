# STEAM Academy — Rediseño de Pagina Web
Este es el Rediseño de la Pagina Web de Steam Academy
## Cómo abrir el proyecto

Abrir esta carpeta con Live Server y visitar la dirección que indique, por ejemplo:

```text
http://127.0.0.1:5500/
```

También se puede ejecutar desde la carpeta del proyecto:

```sh
python -m http.server 5500 --bind 127.0.0.1
```

No se requiere instalar paquetes ni compilar. Para cargar el módulo 3D se debe servir por HTTP; al abrir `index.html` directamente como archivo puede utilizarse únicamente la ilustración de respaldo.

El robot 3D carga automáticamente `robot-fast.glb` con el decodificador Draco local. Si falla esa carga, intenta el modelo original; la imagen de respaldo permanece visible durante la carga o si WebGL falla. El modelo original se conserva para ese caso.

## Archivos

- `index.html`: contenido, navegación y secciones.
- `styles.css`: diseño, adaptación a pantallas y robot de respaldo.
- `script.js`: menú móvil, ventana de contacto y escena 3D.
- `assets/`: logotipo y fotografías. `estudiantes.png` pertenece a la primera propuesta y ya no se utiliza.
- `vendor/`: Three.js 0.174.0, decodificador Draco y sus licencias.
- `model/`: Modelo 3d .glb.

Las fuentes se sirven localmente desde `assets/fonts/`, con alternativa del sistema y licencias SIL OFL 1.1 incluidas. El logotipo y los textos proceden de https://www.stemacademy.com.co/; las fotografías visibles son ilustrativas, se sirven localmente y se acreditan en `assets/SOURCES.md`. Three.js conserva su licencia MIT y el decodificador Draco su licencia Apache 2.0; ninguna cubre los derechos del modelo 3D.

Esta copia estática no envía solicitudes de inscripción. La ventana de contacto ofrece el teléfono publicado por STEAM Academy; cualquier agendamiento real debe gestionarse por un canal confirmado por la academia. El propietario confirmó el 18 de octubre de 2026 que la sede vigente es Cra. 41D #76-281, Las Mercedes, Barranquilla. La política de datos enlazada todavía muestra otra dirección y requiere actualización por su responsable.

Robótica Maker y Héroes de código enlazan a sus fichas oficiales. No se encontró una ficha oficial verificable para Game Developer ni Developer Junior; sus enlaces llaman al teléfono publicado para consultar esos cursos directamente, sin fingir una página de detalle o reserva.

La paleta toma el azul `#116DFF`, el gris `#303232` y el blanco del sitio oficial. La cabecera es fija al desplazarse; la portada se distribuye según la altura disponible de la ventana, con desplazamiento normal en alturas muy pequeñas o al ampliar el texto.

## Revisión de privacidad y accesibilidad

- Esta copia no tiene formularios de captura, pagos, analíticas, cookies propias ni almacenamiento de visitantes. El enlace del pie de página explica este uso real en un diálogo; no se creó un consentimiento ficticio.
- El robot conserva la carga automática. Incluye pausa y giro por teclado, respeta movimiento reducido y mantiene una imagen y descripción si el módulo falla. El modal aísla el fondo con `inert` y restaura el foco.
- La política enlazada es la versión 1.0, vigente desde el 1 de marzo de 2025. Confirmar su aplicación a esta copia, la identidad jurídica y los proveedores/conservación del tratamiento real. La web oficial publica `steamacademi@gmail.com` y Cra. 41D #76-281; el PDF publica `hello@steamacademy.com.co` y Cra. 46 #74-16. La dirección de la web fue confirmada por el propietario, pero el PDF sigue desactualizado.
- Las cuatro ofertas y edades coinciden con la página oficial consultada. No hay estrellas, reseñas ni cifras de resultados en esta copia.
- Antes de publicar, confirmar permisos del logo y los modelos: véase `assets/SOURCES.md`. Las fotos originales de menores se conservan, pero ya no se muestran en la página actual.
- Pesos medidos: modelo comprimido 1.583.136 bytes; modelo original de respaldo 43.272.164 bytes. No se midieron Web Vitals en producción.

Esta revisión técnica local no certifica cumplimiento jurídico ni conformidad integral con WCAG. Las condiciones de contratación de cursos fuera de esta página deben validarse con la academia; aquí no se formalizan reservas ni compras.
