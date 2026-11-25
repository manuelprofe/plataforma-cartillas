#!/usr/bin/env python3
"""Pasa las mallas de docs/pedagogia/pensum/*.md al pensum de cada cartilla.

Escribe public/cartillas/<materia>-<grado>/pensum.json (grado 0 = transición) y el catálogo
public/cartillas/catalogo.json, que el docente usa para elegir materia y grado en el armador y en
la Biblioteca. La malla en Markdown es la fuente: se corrige allí y se vuelve a correr esto.

    python3 herramientas/pensum_a_json.py           # escribe
    python3 herramientas/pensum_a_json.py --revisar # solo cuenta y avisa, no escribe
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / 'docs' / 'pedagogia' / 'pensum'
SALIDA = RAIZ / 'public' / 'cartillas'

GRADOS = ['Transición', '1.°', '2.°', '3.°', '4.°', '5.°']
MATERIAS = {
    'matematicas': {'materia': 'Matemáticas', 'guia': 'Cuadrito', 'cuaderno': 'El cuaderno de Cuadrito'},
    'espanol': {'materia': 'Español', 'guia': 'Renglón', 'cuaderno': 'El cuaderno de Renglón'},
    'ingles': {'materia': 'Inglés', 'guia': 'Postal', 'cuaderno': 'El cuaderno de Postal'},
}
PENSAMIENTOS = {'N': 'Numérico', 'E': 'Espacial', 'M': 'Métrico', 'A': 'Aleatorio', 'V': 'Variacional'}
JUEGOS_ES = {
    'ET': 'escucha-toca', 'EA': 'escucha-atrapa', 'DB': 'di-brilla', 'ME': 'memoria',
    'CT': 'contar-toca', 'OR': 'ordenar', 'AR': 'armar sílaba o palabra', 'Aula': 'en el aula',
}


def limpiar(t: str) -> str:
    """Quita el Markdown de una línea: negritas, cursivas, enlaces y espacios de sobra."""
    t = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', t)
    t = t.replace('**', '').replace('‑', '-')
    t = re.sub(r'(?<![\w*])\*([^*]+)\*(?![\w*])', r'\1', t)
    return re.sub(r'\s+', ' ', t).strip()


def lista(t: str) -> list[str]:
    """Separa por punto y coma (desempeños, temas)."""
    return [limpiar(x).rstrip('.') for x in re.split(r';\s*', t) if limpiar(x)]


def ids_dba(t: str) -> list[str]:
    t = limpiar(t)
    return re.findall(r'T-3[abc]|\d+', t)


def secciones(texto: str, nivel: str) -> list[tuple[str, str]]:
    """(título, cuerpo) de cada encabezado del nivel dado (`##` o `###`)."""
    patron = re.compile(rf'^{re.escape(nivel)} (.+)$', re.M)
    marcas = list(patron.finditer(texto))
    fin_de = lambda i: marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)
    return [(m.group(1).strip(), texto[m.end():fin_de(i)]) for i, m in enumerate(marcas)]


def grado_de(titulo: str) -> int | None:
    t = titulo.lower()
    if 'transici' in t:
        return 0
    for g, palabra in enumerate(['', 'primer', 'segundo', 'tercer', 'cuarto', 'quinto']):
        if g and palabra in t:
            return g
    n = re.search(r'grado (\d)\.', t)
    return int(n.group(1)) if n else None


def corte(cuerpo: str) -> str:
    """El cuerpo de una sección ## sin las secciones ## siguientes."""
    return re.split(r'^---\s*$', cuerpo, flags=re.M)[0] if False else cuerpo


def campos(cuerpo: str) -> dict[str, str]:
    """Las viñetas `- **Nombre:** texto` de una unidad (una viñeta puede seguir en otra línea)."""
    out: dict[str, str] = {}
    actual = None
    for linea in cuerpo.splitlines():
        m = re.match(r'^- \*\*([^*]+?):?\*\*:?\s*(.*)$', linea)
        if m:
            actual = m.group(1).strip().rstrip(':')
            out[actual] = m.group(2)
        elif actual and linea.startswith('  ') and linea.strip():
            out[actual] += ' ' + linea.strip()
        elif not linea.strip():
            actual = None
    return out


def periodo_de_unidad(n: int, total: int, periodos: int) -> int:
    """Periodo de la unidad n (1..total) cuando el año se reparte en `periodos` partes."""
    if total == 8 and periodos == 3:
        return 1 if n <= 3 else 2 if n <= 6 else 3
    return (n - 1) * periodos // total + 1


# ---------------------------------------------------------------- Matemáticas

def matematicas(texto: str) -> dict[int, dict]:
    anexo = texto[texto.index('## Anexo A'):]
    dba: dict[int, list[dict]] = {}
    for titulo, cuerpo in secciones(anexo, '###'):
        g = grado_de(titulo)
        if g is None:
            continue
        if g == 0:
            dba[0] = [{'id': m.group(1).replace('DBA ', ''), 'texto': limpiar(m.group(2))}
                      for m in re.finditer(r'^- \*\*((?:DBA )?[\dT][\w-]*)\.\*\* (.+)$', cuerpo, re.M)]
        else:
            dba[g] = [{'id': m.group(1), 'texto': limpiar(m.group(2))}
                      for m in re.finditer(r'^(\d+)\. (.+)$', cuerpo, re.M)]
    grados: dict[int, dict] = {}
    for titulo, cuerpo in secciones(texto[:texto.index('## Anexo A')], '##'):
        g = grado_de(titulo)
        if g is None or not re.search(r'### U\d', cuerpo):
            continue
        prop = re.search(r'\*\*Propósito:\*\*\s*(.+?)(?:\n\*\*|\n\n|$)', cuerpo, re.S)
        unidades = []
        for t, c in secciones(cuerpo, '###'):
            m = re.match(r'U(\d+) · (.+)', t)
            if not m:
                continue
            n = int(m.group(1))
            meta = re.search(r'^\*(?:4 periodos|4P): P(\d) · (?:3 periodos|3P): P(\d) · (?:Pensamientos? )?([^*]+)\*', c, re.M)
            f = campos(c)
            pens = [PENSAMIENTOS[x] for x in re.findall(r'[NEMAV]', meta.group(3))] if meta else []
            unidades.append({
                'id': f'u{n}',
                'numero': n,
                'titulo': limpiar(m.group(2)),
                'periodo': {'4': int(meta.group(1)), '3': int(meta.group(2))} if meta else
                           {'4': periodo_de_unidad(n, 8, 4), '3': periodo_de_unidad(n, 8, 3)},
                'temas': lista(f.get('Temas', '')),
                'dba': ids_dba(f.get('DBA', '')),
                'pensamientos': pens,
                'desempenos': lista(f.get('Desempeños', '')),
                'juegos': limpiar(f.get('Juegos', '')),
                'analogo': limpiar(f.get('Análogo', '')),
                **({'nota': limpiar(f['Nota'])} if 'Nota' in f else {}),
            })
        grados[g] = {
            'proposito': limpiar(prop.group(1)) if prop else '',
            'dba': dba.get(g, []),
            'ebc': 'Estándares Básicos de Competencias en Matemáticas (MEN, 2006), por pensamiento.' if g else '',
            'unidades': unidades,
        }
    return grados


# ---------------------------------------------------------------- Español

FACTORES = {
    'F1': 'Producción textual', 'F2': 'Comprensión e interpretación textual', 'F3': 'Literatura',
    'F4': 'Medios de comunicación y otros sistemas simbólicos', 'F5': 'Ética de la comunicación',
}


def factores_es(texto: str) -> dict[str, dict[str, str]]:
    """Texto de cada factor de los Estándares: al terminar 3.° y al terminar 5.°."""
    out: dict[str, dict[str, str]] = {}
    for m in re.finditer(r'^\| \*\*(F\d) [^|]+\*\* \| ([^|]+) \| ([^|]+) \|$', texto, re.M):
        out[m.group(1)] = {'3': limpiar(m.group(2)), '5': limpiar(m.group(3))}
    return out


def juegos_es(t: str) -> str:
    t = limpiar(t)
    return re.sub(r'\b(ET|EA|DB|ME|CT|OR|AR)\b', lambda m: JUEGOS_ES[m.group(1)], t).replace('Aula', 'en el aula')


def espanol(texto: str) -> dict[int, dict]:
    fact = factores_es(texto)
    grados: dict[int, dict] = {}
    for titulo, cuerpo in secciones(texto, '##'):
        g = grado_de(titulo)
        if g is None or '| U1 |' not in cuerpo:
            continue
        prop = re.search(r'\*\*Propósito del año\.\*\*\s*(.+?)\n\n', cuerpo, re.S)
        if g == 0:
            dba = [{'id': m.group(1), 'texto': limpiar(m.group(2))}
                   for m in re.finditer(r'^- \*\*DBA (\d+)\.\*\* (.+)$', cuerpo, re.M)]
            # Los DBA del propósito 1 que la malla nombra de apoyo, sin copiarlos literal.
            for ma in re.finditer(r'el DBA (\d+) \(([^)]+)\)', cuerpo):
                dba.append({'id': ma.group(1), 'texto': f'Propósito 1 de los DBA de transición: {ma.group(2)} (apoyo; ver el texto en el documento del MEN).'})
        else:
            bloque = cuerpo[cuerpo.index('**DBA de'):]
            bloque = bloque[:bloque.index('\n\n', bloque.index('\n1. '))]
            dba = [{'id': m.group(1), 'texto': limpiar(m.group(2))} for m in re.finditer(r'^(\d+)\. (.+)$', bloque, re.M)]
        unidades = []
        periodo_actual = 0
        titulos_periodo: dict[int, str] = {}
        for linea in cuerpo.splitlines():
            mp = re.match(r'^\| \*\*Periodo (\d): ([^*]+)\*\*', linea)
            if mp:
                periodo_actual = int(mp.group(1))
                titulos_periodo[periodo_actual] = limpiar(mp.group(2))
                continue
            mu = re.match(r'^\| U(\d+) \| (.+) \|\s*$', linea)
            if not mu:
                continue
            n = int(mu.group(1))
            celdas = [c.strip() for c in mu.group(2).split(' | ')]
            tema = celdas[0]
            mt = re.match(r'\*\*(.+?)\*\*\s*(.*)', tema)
            nombre = limpiar(mt.group(1)).rstrip('.') if mt else limpiar(tema)
            contenidos = mt.group(2) if mt else ''
            if g == 0:
                dba_u, fac, des, jue = celdas[1], '', celdas[2], celdas[3]
            else:
                dba_u, fac, des, jue = celdas[1], celdas[2], celdas[3], celdas[4]
            facs = re.findall(r'F\d', fac)
            unidades.append({
                'id': f'u{n}',
                'numero': n,
                'titulo': nombre,
                'periodo': {'4': periodo_actual or periodo_de_unidad(n, 12, 4), '3': periodo_de_unidad(n, 12, 3)},
                'temas': lista(contenidos),
                'dba': ids_dba(dba_u),
                'factores': [{'id': f, 'nombre': FACTORES[f], 'texto': fact.get(f, {}).get('3' if g <= 3 else '5', '')} for f in facs],
                'desempenos': [limpiar(x) for x in re.split(r'(?<=\.)\s+', des) if limpiar(x)],
                'juegos': juegos_es(jue),
            })
        grados[g] = {
            'proposito': limpiar(prop.group(1)) if prop else '',
            'dba': dba,
            'ebc': '' if g == 0 else f'Estándares Básicos de Competencias del Lenguaje (MEN, 2006), metas al terminar {"3.°" if g <= 3 else "5.°"}.',
            'periodos': titulos_periodo,
            'unidades': unidades,
        }
    return grados


# ---------------------------------------------------------------- Inglés

def ingles(texto: str) -> dict[int, dict]:
    # Regla para pasar a 3 periodos (sección 12): P1 y P2 enteros, P3 recoge los periodos 3 y 4.
    grados: dict[int, dict] = {}
    for titulo, cuerpo in secciones(texto, '##'):
        g = grado_de(titulo)
        if g is None or 'periodo 1.' not in cuerpo:
            continue
        mb = re.search(r'\*\*DBA de [^*]+\*\*[^\n]*\n\n((?:\d+\. .+\n?)+)', cuerpo)
        dba = [{'id': m.group(1), 'texto': limpiar(m.group(2))} for m in re.finditer(r'^(\d+)\. (.+)$', mb.group(1), re.M)] if mb else []
        nivel = re.search(r'\*\*Nivel:\*\*\s*([^*]+?)\s*\*\*', cuerpo)
        unidades = []
        for t, c in secciones(cuerpo, '###'):
            m = re.match(r'.+periodo (\d)\. (.+?) \(([^)]+)\)$', t)
            if not m:
                continue
            n = int(m.group(1))
            f = campos(c)
            voc = limpiar(f.get('Vocabulario', f.get('Vocabulario y expresiones', '')))
            unidades.append({
                'id': f'p{n}',
                'numero': n,
                'titulo': limpiar(m.group(2)),
                'eje': limpiar(m.group(3)),
                'periodo': {'4': n, '3': min(n, 3)},
                'meta': limpiar(f.get('Meta (MEN)', f.get('Meta', ''))),
                'funciones': lista(f.get('Funciones', '')),
                'temas': [x.strip() for x in voc.split(' · ') if x.strip()],
                'gramatica': limpiar(f.get('Gramática en uso', f.get('Expresiones y gramática en uso', ''))),
                'dba': ids_dba(f.get('DBA', '')),
                'desempenos': [limpiar(x) for x in re.split(r';\s*(?=saber)', limpiar(f.get('Desempeños', ''))) if x],
                'juegos': limpiar(f.get('Juegos', '')),
                'analogo': limpiar(f.get('En el aula', f.get('Proyecto (MEN)', f.get('Proyecto', '')))),
                'fuente': limpiar(f.get('Fuente', '')),
            })
        grados[g] = {
            'proposito': f'Nivel {limpiar(nivel.group(1)).rstrip(".")}.' if nivel else '',
            'dba': dba,
            'ebc': '' if g == 0 else 'Estándares Básicos de Competencias en Lenguas Extranjeras: Inglés (MEN, 2006).',
            'unidades': unidades,
        }
    return grados


# ---------------------------------------------------------------- Salida

def version_de(texto: str) -> str:
    m = re.search(r'Versión (\d+)[^·,\n]*[·,]\s*(\d+ de \w+ de \d{4})', texto)
    return f'Versión {m.group(1)} · {m.group(2)}' if m else 'Versión 1'


def main() -> int:
    revisar = '--revisar' in sys.argv
    lectores = {'matematicas': matematicas, 'espanol': espanol, 'ingles': ingles}
    catalogo = []
    avisos = []
    for clave, leer in lectores.items():
        texto = (FUENTES / f'{clave}.md').read_text(encoding='utf-8')
        grados = leer(texto)
        info = MATERIAS[clave]
        for g in range(6):
            datos = grados.get(g)
            cid = f'{clave}-{g}'
            if not datos or not datos['unidades']:
                avisos.append(f'{cid}: sin unidades')
                continue
            conocidos = {d['id'] for d in datos['dba']}
            for u in datos['unidades']:
                faltan = [d for d in u['dba'] if d not in conocidos]
                if faltan:
                    avisos.append(f'{cid} {u["id"]}: DBA sin texto {faltan}')
                if not u['desempenos']:
                    avisos.append(f'{cid} {u["id"]}: sin desempeños')
            pensum = {
                'cartilla': cid,
                'materia': info['materia'],
                'grado': g,
                'gradoNombre': GRADOS[g],
                'guia': info['guia'],
                'titulo': f'{info["cuaderno"]} · {GRADOS[g]}',
                'fuente': f'Contenidos programáticos de {info["materia"]} · {version_de(texto)}',
                **datos,
            }
            catalogo.append({
                'id': cid, 'materia': info['materia'], 'grado': g, 'gradoNombre': GRADOS[g],
                'guia': info['guia'], 'titulo': pensum['titulo'], 'unidades': len(datos['unidades']),
            })
            if not revisar:
                destino = SALIDA / cid / 'pensum.json'
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_text(json.dumps(pensum, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if not revisar:
        (SALIDA / 'catalogo.json').write_text(json.dumps({'cartillas': catalogo}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for c in catalogo:
        print(f'{c["id"]:14} {c["unidades"]:2} unidades')
    for a in avisos:
        print('AVISO', a)
    return 1 if avisos else 0


if __name__ == '__main__':
    sys.exit(main())
