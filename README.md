# STEAM Academy — Rediseño de Pagina Web
Este es el Rediseño de la Pagina Web de Steam Academy
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
