#!/bin/bash
# Impide editar a mano el contenido generado de la cartilla.
archivo=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
case "$archivo" in
  *public/cartillas/ingles-3/cartilla.json)
    echo "cartilla.json se genera: edita el guion en herramientas/construir_bosque.py y vuelve a correrlo." >&2
    exit 2 ;;
esac
exit 0
