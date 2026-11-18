#!/usr/bin/env python3
"""Tiempos de la letra de cada canción, para mostrarla sincronizada (decisión de Manuel, 17 nov).

La letra oficial sale de `docs/pedagogia/canciones-bosque.md` (bloques de código de cada canción)
y los tiempos de una transcripción con ElevenLabs Scribe (palabra por palabra). El script cruza las
dos: cada línea de la letra toma el tiempo de su primera palabra reconocida. Lo que Scribe no oyó
se estima entre las líneas vecinas. Deja `canciones/<tema>.letra.json` junto al audio.

Uso (desde la raíz; la clave de ElevenLabs la pone el proxy del entorno):
    python3 -I herramientas/letras_sincronizadas.py public/cartillas/ingles-3
Con --sin-red usa las transcripciones ya guardadas en canciones/<tema>.scribe.json.
"""
import argparse, difflib, json, re, subprocess, sys, unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DOC = RAIZ / 'docs/pedagogia/canciones-bosque.md'
# tema -> (título en el documento, palabras en inglés que se resaltan)
CANCIONES = {
    'colores': ('Colores', ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white']),
    'numeros': ('Números', ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']),
    'cuerpo': ('Cuerpo', ['eyes', 'ears', 'nose', 'mouth', 'head', 'arms', 'hands', 'legs', 'feet']),
}


def norm(p):
    p = unicodedata.normalize('NFD', p.lower())
    return re.sub(r'[^a-zñ0-9]', '', ''.join(c for c in p if unicodedata.category(c) != 'Mn'))


def letra(titulo):
    texto = DOC.read_text(encoding='utf-8')
    i = texto.index(f'## ', texto.index(titulo + ':') - 10)
    bloque = texto[texto.index('```', i) + 3:]
    bloque = bloque[bloque.index('\n') + 1:bloque.index('```')]
    lineas, seccion = [], ''
    for l in bloque.splitlines():
        l = l.strip()
        if not l:
            continue
        if l.startswith('['):
            seccion = l.strip('[]')
            continue
        lineas.append({'seccion': seccion, 'texto': l})
    return lineas


def transcribir(audio, guardado):
    r = subprocess.run(['curl', '-sS', '-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text',
                        '-H', 'xi-api-key: proxy-injected', '-F', 'model_id=scribe_v1',
                        '-F', 'timestamps_granularity=word', '-F', f'file=@{audio}'],
                       capture_output=True, text=True, check=True)
    guardado.write_text(r.stdout, encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('carpeta', type=Path)
    ap.add_argument('--sin-red', action='store_true')
    a = ap.parse_args()
    for tema, (titulo, ingles) in CANCIONES.items():
        audio = a.carpeta / 'canciones' / f'{tema}.mp3'
        guardado = a.carpeta / 'canciones' / f'{tema}.scribe.json'
        if not a.sin_red or not guardado.exists():
            transcribir(audio, guardado)
        palabras = [w for w in json.loads(guardado.read_text(encoding='utf-8'))['words'] if w.get('type') == 'word']
        oidas = [norm(w['text']) for w in palabras]
        lineas = letra(titulo)
        # Todas las palabras de la letra en orden, recordando a qué línea pertenecen.
        escritas, de_linea = [], []
        for k, l in enumerate(lineas):
            for p in l['texto'].split():
                if norm(p):
                    escritas.append(norm(p)); de_linea.append(k)
        inicio = [None] * len(lineas)
        for bloque in difflib.SequenceMatcher(None, escritas, oidas, autojunk=False).get_matching_blocks():
            for j in range(bloque.size):
                k = de_linea[bloque.a + j]
                t = palabras[bloque.b + j]['start']
                if inicio[k] is None or t < inicio[k]:
                    inicio[k] = t
        # Líneas que Scribe no oyó: se reparten entre las vecinas conocidas.
        duracion = palabras[-1]['end'] if palabras else 0
        for k in range(len(lineas)):
            if inicio[k] is None:
                antes = next((inicio[j] for j in range(k - 1, -1, -1) if inicio[j] is not None), 0.0)
                despues = next((inicio[j] for j in range(k + 1, len(lineas)) if inicio[j] is not None), duracion)
                inicio[k] = antes + (despues - antes) / 2
        for k in range(1, len(lineas)):  # nunca hacia atrás
            inicio[k] = max(inicio[k], inicio[k - 1] + 0.3)
        salida = {'tema': tema, 'audio': f'canciones/{tema}.mp3', 'ingles': ingles,
                  'lineas': [{'t': round(inicio[k] - 0.2, 2), 'seccion': l['seccion'], 'texto': l['texto']}
                             for k, l in enumerate(lineas)]}
        destino = a.carpeta / 'canciones' / f'{tema}.letra.json'
        destino.write_text(json.dumps(salida, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        oidas_ok = sum(1 for x in inicio if x is not None)
        print(f'{tema}: {len(lineas)} líneas → {destino}')


if __name__ == '__main__':
    sys.exit(main())
