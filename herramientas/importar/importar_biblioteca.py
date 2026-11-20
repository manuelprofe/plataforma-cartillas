#!/usr/bin/env python3
"""Biblioteca del docente: trae el CONTENIDO de la cartilla anterior (no su código).

Fuente: manuelprofe/cartillaenglishadventure (index.html y assets). Produce, en el paquete de
la cartilla, `biblioteca/*.json` y las imágenes en WebP al tamaño en que se muestran:
- historia.json      El cuaderno que abrió Englishland: escenas bilingües con su imagen.
- documentos.json    Fundamentación, Mission Stars, niveles y pensum, referencias (bloques en
                     español, como los escribió Manuel).
- actividades.json   Banco de actividades: tema, nivel, estilo, DBA, estándar, fases de Bruner
                     (enactiva, icónica, simbólica) y adaptación.
- recursos.json      Recursos por tema: fichas descargables, videos y juegos en línea.

Uso (desde la raíz; la extracción de los datos JS la hace el script de Node hermano):
    node herramientas/importar/extraer_cartilla_anterior.mjs <anterior>/index.html /tmp/anterior.json
    python3 -I herramientas/importar/importar_biblioteca.py <anterior> /tmp/anterior.json public/cartillas/ingles-3
"""
import html, json, re, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path

# Tema de la cartilla anterior -> nivel (CLAUDE.md: universo de English Adventure Quest).
NIVEL_DE = {**dict.fromkeys(['school-objects', 'colors', 'numbers-1-20', 'body-parts', 'time'], 'n1'),
            **dict.fromkeys(['emotions', 'food', 'clothes', 'animals'], 'n2'),
            **dict.fromkeys(['daily-routine', 'action-verbs', 'present-simple', 'questions'], 'n3'),
            **dict.fromkeys(['places-in-town', 'there-is-there-are', 'adjectives', 'dialogue-structures'], 'n4')}

BLOQUE = {'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'td', 'th', 'blockquote', 'figcaption'}


class Bloques(HTMLParser):
    """Recorre una sección y devuelve bloques {t: titulo|parrafo|item, n, texto} en español."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pila, self.bloques, self.actual, self.saltar = [], [], None, 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        clases = (a.get('class') or '').split()
        omitir = 'only-en' in clases or tag in ('script', 'style', 'button', 'nav', 'svg') or a.get('aria-hidden') == 'true'
        self.pila.append((tag, omitir))
        if omitir:
            self.saltar += 1
        if self.saltar:
            return
        if tag in BLOQUE:
            self.cerrar()
            self.actual = {'tag': tag, 'texto': ''}
        elif tag == 'br' and self.actual:
            self.actual['texto'] += '\n'

    def handle_endtag(self, tag):
        while self.pila:
            t, omitir = self.pila.pop()
            if omitir:
                self.saltar -= 1
            if t == tag:
                break
        if not self.saltar and tag in BLOQUE:
            self.cerrar()

    def handle_data(self, data):
        if self.saltar:
            return
        if self.actual is None:
            if data.strip():
                self.actual = {'tag': 'p', 'texto': ''}
            else:
                return
        self.actual['texto'] += data

    def cerrar(self):
        if not self.actual:
            return
        texto = re.sub(r'[ \t\r\f\v]+', ' ', self.actual['texto']).strip()
        texto = re.sub(r'\s*\n\s*', '\n', texto)
        tag = self.actual['tag']
        self.actual = None
        if not texto or re.fullmatch(r'[\W_]+', texto):  # solo emojis o signos
            return
        if tag.startswith('h'):
            self.bloques.append({'t': 'titulo', 'n': int(tag[1]), 'texto': texto})
        elif tag == 'li':
            self.bloques.append({'t': 'item', 'texto': texto})
        else:
            self.bloques.append({'t': 'parrafo', 'texto': texto})


def seccion(fuente, ident):
    i = fuente.index(f'id="{ident}"')
    inicio = fuente.rfind('<', 0, i)
    j = fuente.find('<section', i + 10)
    return fuente[inicio: j if j > 0 else len(fuente)]


def bloques(fragmento):
    p = Bloques()
    p.feed(fragmento)
    p.cerrar()
    # Sin duplicados seguidos (títulos repetidos por pestañas).
    limpio = []
    for b in p.bloques:
        if not limpio or limpio[-1] != b:
            limpio.append(b)
    return limpio


def texto(fr):
    fr = re.sub(r'<br\s*/?>', '\n', fr)
    fr = re.sub(r'<[^>]+>', '', fr)
    return ' '.join(html.unescape(fr).split())


def webp(origen, destino, ancho):
    destino.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(origen), '-vf', f'scale={ancho}:-2',
                    '-c:v', 'libwebp', '-quality', '78', str(destino)], check=True)


def historia(fuente, anterior, salida):
    sec = seccion(fuente, 'story-adventure')
    escenas = []
    for k, art in enumerate(re.findall(r'<article class="story-scene"[^>]*>(.*?)</article>', sec, flags=re.S), 1):
        img = re.search(r'<img class="story-art-img" src="([^"]+)"', art)
        imagen = None
        if img and (anterior / img.group(1)).exists():
            nombre = f'biblioteca/historia/{Path(img.group(1)).stem}.webp'
            if not (salida / nombre).exists():
                webp(anterior / img.group(1), salida / nombre, 900)
            imagen = nombre
        lado = {}
        for idioma, clase in (('es', 'only-es'), ('en', 'only-en')):
            # Hasta el bloque del otro idioma (o el final): adentro puede haber divs anidados.
            otro = 'only-en' if clase == 'only-es' else 'only-es'
            m = re.search(rf'<div class="{clase}">(.*?)(?:<div class="{otro}">|$)', art, flags=re.S)
            if not m:
                continue
            bloque = m.group(1)
            titulo = texto((re.search(r'<h3>(.*?)</h3>', bloque, flags=re.S) or [None, ''])[1])
            parrafos = [texto(p) for p in re.findall(r'<p[^>]*>(.*?)</p>', bloque, flags=re.S)]
            lado[idioma] = {'titulo': titulo, 'parrafos': [p for p in parrafos if p]}
        palabras = re.findall(r'<span class="(?:magic-word|story-word)[^"]*">([^<]+)</span>', art)
        escenas.append({'n': k, 'imagen': imagen, **lado, 'palabras': sorted(set(w.strip() for w in palabras), key=palabras.index)})
    intro = re.search(r'<div class="story-header">(.*?)</div>\s*<div class="story-scene-grid">', sec, flags=re.S)
    return {'titulo': 'El cuaderno que abrió Englishland', 'en_titulo': 'The notebook that opened Englishland',
            'intro': texto(re.search(r'<p[^>]*>(.*?)</p>', intro.group(1), flags=re.S).group(1)) if intro else '',
            'escenas': escenas,
            'personajes': personajes(fuente)}


def personajes(fuente):
    """Guías de Englishland (portada de la cartilla anterior): nombre y función pedagógica."""
    i = fuente.find('Personajes como mediadores')
    tarjetas = re.findall(r'<article class="guide-card">.*?<h3>(.*?)</h3><p[^>]*>(.*?)</p>', fuente[i:i + 8000], flags=re.S)
    return [{'nombre': texto(n), 'funcion': texto(f)} for n, f in tarjetas]


def referencias(fuente):
    m = re.search(r'const REFERENCES_TEXT\s*=\s*(?:String\.raw)?`(.*?)`', fuente, flags=re.S)
    return [l.strip() for l in (m.group(1).splitlines() if m else []) if l.strip()]


def main():
    anterior, datos_js, salida = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    fuente = (anterior / 'index.html').read_text(encoding='utf-8')
    js = json.loads(datos_js.read_text(encoding='utf-8'))
    dest = salida / 'biblioteca'
    dest.mkdir(parents=True, exist_ok=True)

    (dest / 'historia.json').write_text(json.dumps(historia(fuente, anterior, salida), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    docs = []
    for ident, titulo in (('fundamentacion', 'Fundamentación teórica'), ('mission-stars', 'Sistema Mission Stars'),
                          ('niveles', 'Niveles y pensum'), ('referencias', 'Referencias bibliográficas')):
        if ident == 'referencias':
            docs.append({'id': ident, 'titulo': titulo, 'bloques': [{'t': 'item', 'texto': r} for r in referencias(fuente)]})
        else:
            docs.append({'id': ident, 'titulo': titulo, 'bloques': bloques(seccion(fuente, ident))})
    (dest / 'documentos.json').write_text(json.dumps({'documentos': docs, 'misiones': js.get('MISSIONS') or []}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    act = []
    for a in js.get('ACTIVITIES') or []:
        act.append({'nombre': a.get('name'), 'nivel': a.get('level'), 'nivel_nombre': a.get('lName'), 'tema': a.get('topic'),
                    'estilo': (js.get('STYLE_LABELS') or {}).get(a.get('style'), a.get('style')), 'recurso': a.get('resource'),
                    'adaptacion': a.get('adapt'), 'dba': a.get('dba'), 'estandar': a.get('standards'),
                    'fases': {'enactiva': a.get('en'), 'iconica': a.get('ic'), 'simbolica': a.get('si')}})
    (dest / 'actividades.json').write_text(json.dumps({'actividades': act}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    visuales = js.get('RESOURCE_TOPIC_VISUALS') or {}
    recursos = []
    for clave, r in (js.get('resourcesData') or {}).items():
        nombre = r.get('topicName')
        vis = visuales.get(nombre) or {}
        imagen = None
        if vis.get('image') and (anterior / vis['image']).exists():
            imagen = f'biblioteca/temas/{Path(vis["image"]).stem}.webp'
            if not (salida / imagen).exists():
                webp(anterior / vis['image'], salida / imagen, 480)
        nivel = NIVEL_DE.get(clave)
        recursos.append({'id': clave, 'tema': nombre, 'nivel': nivel, 'nota': vis.get('note'), 'imagen': imagen,
                         'descargables': r.get('downloadableFiles') or [], 'videos': r.get('youtubeVideos') or [],
                         'juego_en_linea': r.get('kahoot')})
    niveles = {k: {'titulo': v.get('title'), 'territorio': v.get('territory'), 'importancia': v.get('importance'),
                   'pensum': v.get('pensum'), 'evidencia': v.get('evidence')}
               for k, v in (js.get('RESOURCE_LEVELS') or {}).items()}
    (dest / 'recursos.json').write_text(json.dumps({'niveles': niveles, 'recursos': recursos}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('biblioteca:', ', '.join(f.name for f in sorted(dest.glob('*.json'))))


if __name__ == '__main__':
    sys.exit(main())
