"""Escribe en una migración SQL la lista de misiones de un paquete de cartilla.

La base de datos solo acepta progreso de misiones que existen (tabla `misiones`). Este guion lee
el paquete (cartilla.json) y reemplaza el bloque entre `-- misiones:inicio` y `-- misiones:fin`
de la migración con la cartilla y sus misiones. Nunca se escribe esa lista a mano.

Uso: python3 -I herramientas/misiones_sql.py public/cartillas/ingles-3/cartilla.json supabase/migraciones/002-esqueleto.sql
Si cambian las misiones del paquete, se genera una migración nueva con este mismo guion.
"""
import json
import re
import sys


def literal(texto):
    return "'" + str(texto).replace("'", "''") + "'"


def bloque(cartilla):
    cid = cartilla["id"]
    misiones = [m["id"] for t in cartilla["territorios"] for m in t["misiones"]]
    if len(set(misiones)) != len(misiones):
        raise SystemExit("Hay misiones con el mismo id en el paquete")
    lineas = [
        "-- misiones:inicio (generado por herramientas/misiones_sql.py desde el paquete; no editar a mano)",
        "insert into public.cartillas (id, titulo, materia, grado) values "
        f"({literal(cid)}, {literal(cartilla['titulo'])}, {literal(cartilla.get('materia', ''))}, {literal(cartilla.get('grado', ''))})",
        "  on conflict (id) do update set titulo = excluded.titulo, materia = excluded.materia, grado = excluded.grado;",
        "insert into public.misiones (cartilla_id, mision_id) values",
        ",\n".join(f"  ({literal(cid)}, {literal(m)})" for m in misiones),
        "  on conflict do nothing;",
        f"-- {len(misiones)} misiones de {cid}",
        "-- misiones:fin",
    ]
    return "\n".join(lineas)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        cartilla = json.load(f)
    with open(sys.argv[2], encoding="utf-8") as f:
        sql = f.read()
    patron = re.compile(r"-- misiones:inicio.*?-- misiones:fin", re.S)
    if not patron.search(sql):
        raise SystemExit("La migración no tiene el bloque -- misiones:inicio / -- misiones:fin")
    sql = patron.sub(lambda _: bloque(cartilla), sql, count=1)
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(sql)
    print("Misiones escritas en", sys.argv[2])


if __name__ == "__main__":
    main()
