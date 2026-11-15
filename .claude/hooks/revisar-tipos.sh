#!/bin/bash
# Después de editar un archivo de src/, revisa los tipos de todo el proyecto.
# Si hay errores, se los muestra a Claude (salida 2) para que los corrija enseguida.
archivo=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
case "$archivo" in
  "$PWD"/src/*.ts|"$PWD"/src/*.tsx|src/*.ts|src/*.tsx) ;;
  *) exit 0 ;;
esac
[ -x node_modules/.bin/tsc ] || exit 0   # sin dependencias instaladas no se revisa
salida=$(node_modules/.bin/tsc --noEmit 2>&1) && exit 0
echo "Errores de tipos después de editar $archivo:" >&2
echo "$salida" | head -30 >&2
exit 2
