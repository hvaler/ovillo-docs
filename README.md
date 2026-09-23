# Portal de documentacion de Ovillo

Publicado en https://hvaler.github.io/ovillo-docs/ · generado ENTERO por `node scripts/build-portal.js` del repositorio del ecosistema
(plantillas en `scripts/portal/templates/`, prosa de autor en `publicacion/src/`). **No editar aqui**: editar la fuente y
regenerar. `--check` detecta drift y forma parte del flujo de release; cada push a `main` que toque este directorio lo publica.

Fuentes: `recursos/data/inventory.json` (generate-inventory.js), `ovillo/.claude/{skills,agents,hooks,rules,schemas}`, `adr/ADR-*.md`,
`ovillo/README.md`, `INICIO_RAPIDO.md`, `_patron/**`, `_hilo/**`, `hub/Endpoints/*.cs`, `scripts/eval-results`, `measure-context.js`, git log.
Manifiesto de paginas: `recursos/data/pages.json`. Sin frameworks ni peticiones externas: fuentes en `recursos/fonts/` (OFL, ver `OFL.txt`).

## Licencia y autoria

Copyright 2026 Hugo Valer Rojas. Ing. Hugo Valer Rojas (Arquitecto de Software). Licencia Apache-2.0 (`LICENSE.txt`, `NOTICE.txt`, con la excepcion para el andamiaje que Ovillo
escribe en tu proyecto). Errores y sugerencias: Issues de este repositorio (`CONTRIBUTING.md`); vulnerabilidades: `SECURITY.md`.
