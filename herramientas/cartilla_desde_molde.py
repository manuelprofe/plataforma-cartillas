#!/usr/bin/env python3
"""Arma una cartilla nueva sobre el mundo de otra (el molde) y su contenido propio.

El molde aporta solo la geometría de la página: mapa, caminos, posiciones de las misiones, casas,
vecinos, árboles y criaturas. Todo lo que se dice, se juega y se ve en las misiones sale del
archivo de contenido (docs/pedagogia/cartillas/<id>.json): misiones con sus palabras e iconos,
encargos de los vecinos, escenas, guía y voz. Así el motor no sabe de materias: solo lee datos.

    python3 -I herramientas/cartilla_desde_molde.py docs/pedagogia/cartillas/matematicas-0.json

Escribe public/cartillas/<id>/cartilla.json y copia del molde solo los archivos que el paquete
nombra. Los iconos compuestos (escenas hechas con emojis de Twemoji, CC BY 4.0, y figuras) se
dibujan como SVG en iconos/; los emojis que no estén en el molde se bajan una vez de jsDelivr y
quedan en herramientas/twemoji/ para no volver a pedirlos.
Las frases no tienen voz grabada: la app usa la voz del navegador hasta que se corra
generar_voz.py sobre el paquete nuevo.
"""
import copy
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARTILLAS = RAIZ / 'public' / 'cartillas'
CACHE_EMOJI = RAIZ / 'herramientas' / 'twemoji'
TWEMOJI = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/{}.svg'
MEDIO = re.compile(r'\.(webp|png|jpg|jpeg|svg|mp3|mp4|m4a|ogg|webm|avif)$', re.I)


def emoji(codigo: str) -> str:
    """El SVG de un emoji (sin la etiqueta exterior), del molde, de la caché o de jsDelivr."""
    CACHE_EMOJI.mkdir(exist_ok=True)
    archivo = CACHE_EMOJI / f'{codigo}.svg'
    if not archivo.exists():
        with urllib.request.urlopen(TWEMOJI.format(codigo), timeout=30) as r:
            archivo.write_bytes(r.read())
    svg = archivo.read_text(encoding='utf-8')
    return re.sub(r'^<svg[^>]*>|</svg>\s*$', '', svg.strip())


def dibujar(piezas: list[dict]) -> str:
    """Un icono de 36 × 36 hecho de emojis (e, x, y, t = lado) y figuras simples, en orden."""
    partes = []
    for p in piezas:
        relleno = p.get('fill', 'none')
        trazo = f' stroke="{p["stroke"]}" stroke-width="1.6" stroke-linejoin="round"' if 'stroke' in p else ''
        if 'e' in p:
            partes.append(f'<svg x="{p["x"]}" y="{p["y"]}" width="{p["t"]}" height="{p["t"]}" viewBox="0 0 36 36">{emoji(p["e"])}</svg>')
        elif 'rect' in p:
            x, y, w, h = p['rect']
            partes.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="1.5" fill="{relleno}"{trazo}/>')
        elif 'circulo' in p:
            cx, cy, r = p['circulo']
            partes.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{relleno}"{trazo}/>')
        elif 'poligono' in p:
            puntos = ' '.join(f'{a},{b}' for a, b in zip(p['poligono'][::2], p['poligono'][1::2]))
            partes.append(f'<polygon points="{puntos}" fill="{relleno}"{trazo} stroke-linejoin="round"/>')
        elif 'linea' in p:
            x1, y1, x2, y2 = p['linea']
            partes.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{p.get("stroke", "#999")}" stroke-width="1.4" stroke-dasharray="2 2" stroke-linecap="round"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">{"".join(partes)}</svg>\n'


def en_espanol(nodo):
    """En una cartilla con voz en español, cada par es/en queda en español (en = es)."""
    if isinstance(nodo, dict):
        if isinstance(nodo.get('es'), str) and 'en' in nodo:
            nodo['en'] = nodo['es']
        for v in nodo.values():
            en_espanol(v)
    elif isinstance(nodo, list):
        for v in nodo:
            en_espanol(v)


def renombrar(nodo, nombres: dict[str, str]):
    """Cambia los ids de misión del molde por los nuevos en todo el territorio (valores, no claves)."""
    if isinstance(nodo, dict):
        return {k: renombrar(v, nombres) for k, v in nodo.items()}
    if isinstance(nodo, list):
        return [renombrar(v, nombres) for v in nodo]
    if isinstance(nodo, str):
        return nombres.get(nodo, nodo)
    return nodo


def medios(nodo, salida: set[str]):
    if isinstance(nodo, str):
        if MEDIO.search(nodo) and not re.search(r'[\s:]', nodo) and not nodo.startswith('/'):
            salida.add(nodo)
    elif isinstance(nodo, list):
        for v in nodo:
            medios(v, salida)
    elif isinstance(nodo, dict):
        for v in nodo.values():
            medios(v, salida)


def main() -> int:
    contenido = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    cid = contenido['id']
    molde_dir = CARTILLAS / contenido['molde']
    destino = CARTILLAS / cid
    molde = json.loads((molde_dir / 'cartilla.json').read_text(encoding='utf-8'))
    guia = contenido['guia']
    palabras = contenido['palabras']

    def palabra(clave: str) -> dict:
        p = dict(palabras[clave])
        p.setdefault('en', p['es'])
        return p

    def linea(quien: str, texto: str, *resto) -> dict:
        """[quien, es] o [quien, es, en], y al final, si hay, la lista de opciones [es, ir, icono, en]."""
        en = next((r for r in resto if isinstance(r, str)), texto)
        opciones = next((r for r in resto if isinstance(r, list)), None)
        l = {'quien': quien, 'es': texto, 'en': en}
        if opciones:
            l['opciones'] = []
            for o in opciones:
                op = {'es': o[0], 'en': o[3] if len(o) > 3 else o[0]}
                if len(o) > 1 and o[1]:
                    if o[1].startswith('@'):
                        op['destino'] = o[1][1:]
                    else:
                        op['ir'] = o[1]
                if len(o) > 2 and o[2]:
                    op['icono'] = o[2]
                l['opciones'].append(op)
        return l

    cartilla = copy.deepcopy(molde)
    cartilla.update({
        'id': cid, 'titulo': contenido['titulo'], 'materia': contenido['materia'], 'grado': contenido['grado'],
        'idiomaVoz': contenido['idiomaVoz'], 'voz': {},
    })
    cartilla['imagenes'] = {'portada': guia['imagen'], 'fiesta': guia['fiesta']}
    # Mundo propio de la materia (camino de Cuadrito, biblioteca de Renglón); sin él, el mapa del molde.
    if 'vista' in contenido:
        cartilla['vista'] = contenido['vista']
    cartilla['territorios'] = cartilla['territorios'][:1]
    t = cartilla['territorios'][0]
    t['nombre'] = contenido['territorio']
    t['idiomaPorAvance'] = ['es']

    # El guía de la materia toma el lugar del guía del molde (Postal) en la página.
    anterior = t['puerta']['personaje']
    t['personajes'].pop(anterior, None)
    t['personajes'][guia['id']] = {'nombre': guia['nombre'], 'imagen': guia['imagen'], 'ancho': 96, **({'idioma': guia['idioma']} if 'idioma' in guia else {})}
    t['puerta']['personaje'] = guia['id']
    # El guía de la materia acompaña también los juegos.
    t['guia'] = guia['id']
    for h in t['mundo']['habitantes']:
        if h['personaje'] == anterior:
            h.update({'id': guia['id'], 'personaje': guia['id'], 'escena': guia['id']})

    # Misiones: cada zona del molde (tres por camino) recibe las del contenido, en el mismo lugar.
    por_id = {m['id']: m for m in t['misiones']}
    nombres: dict[str, str] = {}
    nuevas = []
    for zona, z in contenido['zonas'].items():
        lugares = [zona] + [f'{zona}-{i}' for i in range(2, 6) if f'{zona}-{i}' in por_id]
        if len(z['misiones']) > len(lugares):
            raise SystemExit(f'{zona}: {len(z["misiones"])} misiones y solo {len(lugares)} lugares en el molde')
        for i, (lugar, m) in enumerate(zip(lugares, z['misiones'])):
            nuevo = z['id'] if i == 0 else f'{z["id"]}-{i + 1}'
            nombres[lugar] = nuevo
            base = por_id[lugar]
            mision = {
                'id': nuevo, 'titulo': m['titulo'], 'plantilla': m['plantilla'], 'icono': m['icono'],
                'palabras': [palabra(p) for p in m['palabras']],
                'x': base['x'], 'y': base['y'],
                'antes': [linea(guia['id'], *m['antes']) if isinstance(m['antes'], list) else linea(guia['id'], m['antes'])],
                'familia': z['familia'],
            }
            if i:
                mision['requiere'] = nombres[lugares[i - 1]]
            if m['plantilla'] == 'escucha-atrapa':
                mision['atrapa'] = base.get('atrapa') or next(x['atrapa'] for x in t['misiones'] if 'atrapa' in x)
            for extra in ('contar', 'ordenar', 'operacion', 'silabas', 'formas', 'parejas', 'leer', 'plataformas', 'cuento', 'numeros'):
                if extra in m:
                    mision[extra] = m[extra]
            nuevas.append(mision)
        for sobra in lugares[len(z['misiones']):]:
            nombres[sobra] = nombres[lugares[len(z['misiones']) - 1]]
    pozo_molde = next(m for m in t['misiones'] if m['plantilla'] == 'memoria' and m.get('palabrasDe'))
    pozo = copy.deepcopy(pozo_molde)
    pozo.update({'id': contenido['pozo']['id'], 'titulo': contenido['pozo']['titulo'], 'antes': [linea('goma', contenido['pozo']['antes'])]})
    pozo['formas'] = ['imagen-sonido']
    nombres[pozo_molde['id']] = pozo['id']
    pozo['palabrasDe'] = sorted({nombres[x] for x in pozo_molde['palabrasDe'] if x in nombres}, key=lambda x: [m['id'] for m in nuevas].index(x))
    pozo['requiereAlguna'] = [nombres[x] for x in pozo_molde['requiereAlguna'] if x in nombres]
    nuevas.append(pozo)
    t['misiones'] = nuevas

    # El mundo (letreros, casas, vecinos) nombra misiones del molde: pasan a las nuevas.
    t['mundo'] = renombrar(t['mundo'], nombres)
    t['puerta'] = renombrar(t['puerta'], nombres)
    for h in t['mundo']['habitantes']:
        e = contenido['encargos'].get(h['id'])
        if e and 'encargo' in h:
            h['encargo']['pide'] = palabra(e['pide'])
            h['encargo']['opciones'] = [palabra(o) for o in e['opciones']]

    # Escenas: todas las del contenido; ninguna del molde queda (hablaban de otra materia).
    # Con `conservarEscenas` quedan las del molde (misma materia) y el contenido cambia solo las que trae.
    escenas = renombrar(copy.deepcopy(t['escenas']), nombres) if contenido.get('conservarEscenas') else {}
    for clave, valor in contenido['escenas'].items():
        if isinstance(valor, dict):
            escenas[clave] = {'lineas': [linea(*l) for l in valor['lineas']], **({'luego': valor['luego']} if 'luego' in valor else {})}
        else:
            escenas[clave] = {'lineas': [linea(*l) for l in valor]}
    for clave, valor in t['escenas'].items():
        if 'luego' in valor and clave in escenas and 'luego' not in escenas[clave]:
            escenas[clave]['luego'] = valor['luego']
    faltan = sorted(set(t['escenas']) - set(escenas) - {anterior})
    if faltan:
        raise SystemExit(f'Faltan escenas en el contenido: {faltan}')
    t['escenas'] = renombrar(escenas, nombres)
    # Las pistas del piso de cada camino llevan el icono de la primera misión de su zona.
    icono_de = {m['id']: m['icono'] for m in nuevas}
    for h in t['mundo'].get('huellas', []):
        if h.get('mision') in icono_de:
            h['icono'] = icono_de[h['mision']]
    for clave, texto in contenido.get('ayudas', {}).items():
        cartilla['ayudas'][clave] = {'es': texto, 'en': texto}
    t.pop('cinematicas', None)
    cartilla.pop('cinematicas', None)

    if contenido['idiomaVoz'].startswith('es'):
        en_espanol(cartilla)

    # Iconos compuestos y archivos del paquete.
    destino.mkdir(parents=True, exist_ok=True)
    (destino / 'iconos').mkdir(exist_ok=True)
    for nombre, piezas in contenido.get('iconos', {}).items():
        (destino / 'iconos' / f'{nombre}.svg').write_text(dibujar(piezas), encoding='utf-8')
    usados: set[str] = set()
    medios(cartilla, usados)
    faltan_archivos = []
    for ruta in sorted(usados):
        if (destino / ruta).exists() and ruta.startswith('iconos/') and Path(ruta).stem in contenido.get('iconos', {}):
            continue
        origen = molde_dir / ruta
        if origen.exists():
            (destino / ruta).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(origen, destino / ruta)
        elif re.fullmatch(r'iconos/[0-9a-f_]+\.svg', ruta):
            (destino / ruta).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">{emoji(Path(ruta).stem.replace("_", "-"))}</svg>\n', encoding='utf-8')
        else:
            faltan_archivos.append(ruta)
    if faltan_archivos:
        raise SystemExit(f'Archivos que no están en el molde: {faltan_archivos}')
    (destino / 'cartilla.json').write_text(json.dumps(cartilla, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{cid}: {len(nuevas)} misiones, {len(usados)} archivos, {len(escenas)} escenas')
    return 0


if __name__ == '__main__':
    sys.exit(main())
