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

El robot 3D carga automáticamente el modelo original al abrir la página. El archivo `robot-fast.glb` requiere un decodificador Draco que no está incluido en el proyecto y no se usa hasta incorporar y verificar ese soporte. La imagen de respaldo permanece visible durante la carga o si WebGL falla.

## Archivos

- `index.html`: contenido, navegación y secciones.
- `styles.css`: diseño, adaptación a pantallas y robot de respaldo.
- `script.js`: menú móvil, ventana de contacto y escena 3D.
- `assets/`: logotipo y fotografías. `estudiantes.png` pertenece a la primera propuesta y ya no se utiliza.
- `vendor/`: Three.js 0.174.0 y su licencia.
- `model/`: Modelo 3d .glb.

Las fuentes se sirven localmente desde `assets/fonts/`, con alternativa del sistema y licencias SIL OFL 1.1 incluidas. El logotipo, las fotografías y los textos proceden de https://www.stemacademy.com.co/; la licencia MIT incluida corresponde únicamente a Three.js.

Esta copia estática no envía solicitudes de inscripción. La ventana de contacto ofrece el teléfono publicado por STEAM Academy y enlaces a sus cursos oficiales; cualquier agendamiento real debe gestionarse por un canal confirmado por la academia. Antes de publicar una dirección física, conviene confirmar cuál está vigente: las páginas de cursos y la política de datos enlazada muestran direcciones distintas.

La paleta toma el azul `#116DFF`, el gris `#303232` y el blanco del sitio oficial. La cabecera es fija al desplazarse; la portada se distribuye según la altura disponible de la ventana, con desplazamiento normal en alturas muy pequeñas o al ampliar el texto.

## Revisión de privacidad y accesibilidad

- Esta copia no tiene formularios de captura, pagos, analíticas, cookies propias ni almacenamiento de visitantes. El pie describe ese funcionamiento técnico; no se creó una política legal ni un consentimiento ficticio.
- El robot conserva la carga automática. Incluye pausa y giro por teclado, respeta movimiento reducido y mantiene una imagen y descripción si el módulo falla. El modal aísla el fondo con `inert` y restaura el foco.
- La política enlazada es la versión 1.0, vigente desde el 1 de marzo de 2025. Confirmar su aplicación a esta copia, la identidad jurídica y los proveedores/conservación del tratamiento real. Aclarar también el uso promocional de imágenes del apartado 6 frente a los fines exclusivamente educativos para menores del apartado 11. La web oficial publica `steamacademi@gmail.com` y Cra. 41d #76 281; el PDF publica `hello@steamacademy.com.co` y Cra. 46 #74-16. No se sustituyeron contactos ni se añadió una dirección sin validación del titular.
- Las cuatro ofertas y edades coinciden con la página oficial consultada. No hay estrellas, reseñas ni cifras de resultados en esta copia.
- Antes de publicar, confirmar permisos de fotos de menores, logo y modelos: véase `assets/SOURCES.md`. Una publicación en Instagram no prueba autorización de reutilización.
- Peso medido del GLB utilizado: 43.272.164 bytes; fuentes locales: 59.220 bytes. No se midieron Web Vitals ni se incorporó un decodificador nuevo para `robot-fast.glb`.

Esta revisión técnica local no certifica cumplimiento jurídico ni conformidad integral con WCAG. Las condiciones de contratación de cursos fuera de esta página deben validarse con la academia; aquí no se formalizan reservas ni compras.
