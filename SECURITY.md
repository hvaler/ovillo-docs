# Seguridad

Este repositorio contiene el **portal de documentación** de Ovillo, generado automáticamente desde el repositorio del
ecosistema. No ejecuta código en el servidor: es HTML, CSS y un script propio servidos por GitHub Pages, sin peticiones a
terceros.

## Cómo reportar una vulnerabilidad

Si encuentras un problema de seguridad en Ovillo (el plugin `hv@ovillo`, el zip distribuible, los instaladores, los hooks,
las plantillas de CI/CD, el Hub o este portal), **no abras una issue pública**. Usa el reporte privado de GitHub:

https://github.com/hvaler/ovillo-docs/security/advisories/new

Incluye la versión de Ovillo (`VERSION.json` o `claude plugin list`), el componente afectado, los pasos para reproducirlo y
el impacto que estimas. Recibirás acuse en un plazo razonable y se coordinará contigo la corrección y su publicación.

## Qué se considera vulnerabilidad

- Un hook o skill que ejecute código o comandos no previstos, filtre secretos o escriba fuera del proyecto.
- Plantillas de pipeline que expongan secretos, usen acciones sin fijar por SHA o concedan permisos excesivos.
- Instaladores que descarguen o ejecuten contenido sin verificar los hashes publicados.
- Cualquier endpoint del Hub que permita acceso sin la API key o que exponga datos de otros proyectos.

## Alcance excluido

El código que Ovillo genera o materializa **dentro de tu proyecto** pasa a ser tuyo (ver `NOTICE.txt`): revisa y prueba lo
que aceptas, como con cualquier herramienta de generación.
