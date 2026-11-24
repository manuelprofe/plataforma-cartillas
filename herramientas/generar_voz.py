#!/usr/bin/env python3
"""Genera la voz de una cartilla como archivos de audio, una sola vez.

Lee `cartilla.json`, reúne todo lo que la app dice en voz alta y lo convierte a MP3 con
Kokoro (voz neuronal que corre en este computador; no envía nada a internet). Deja los
archivos en `voz/` junto a la cartilla y anota en `cartilla.json` el índice `voz`
(idioma -> texto -> archivo). La app busca cada frase ahí; si no está, usa la voz del navegador.
Correrlo después de `construir_bosque.py` cada vez que cambien los textos.

Uso (desde la raíz del proyecto):
    pip install kokoro-onnx soundfile        # y tener ffmpeg instalado
    python3 herramientas/generar_voz.py public/cartillas/ingles-3 --voces <carpeta del modelo>

La carpeta del modelo debe tener `kokoro-v1.0.onnx` y `voices-v1.0.bin`, de
https://github.com/thewh1teagle/kokoro-onnx/releases (modelo Kokoro-82M, licencia Apache 2.0).
Solo se generan las frases nuevas o cambiadas; las que ya no se usan se borran.
Para cambiar de voz basta editar VOCES: el nombre del archivo depende de la voz.

Voces de personajes con ElevenLabs: las frases en español de Goma (y las ayudas sin personaje,
que dice Goma) se generan con ElevenLabs
si existe la variable ELEVENLABS_API_KEY (en las sesiones en la nube basta un valor cualquiera:
el proxy pone la clave). El vocabulario en inglés usa una voz nativa (Emma). Los vecinos y el héroe del niño siguen con
Kokoro hasta que se aprueben voces para ellos. Con ElevenLabs no hace falta --voces mientras no
haya frases nuevas de Kokoro.
"""
import argparse, hashlib, json, os, subprocess, sys, tempfile, urllib.request
from pathlib import Path

# idioma -> (voz de Kokoro, código de idioma, velocidad). Un poco más despacio que lo normal:
# quien escucha tiene 7 u 8 años y, en inglés, está oyendo la palabra por primera vez.
VOCES = {'es': ('ef_dora', 'es', 0.82), 'en': ('af_heart', 'en-us', 0.85)}

# Personaje -> voz de ElevenLabs (voice_id de la biblioteca). None = frase sin personaje (ayudas).
MODELO_EL = 'eleven_v4'
VOCES_EL = {
    'goma': 'iV6xDQ4wcM3ZcXDx30GB',    # Betty: latina, de caricatura (la misma de los videos, 24 nov)
    None: 'iV6xDQ4wcM3ZcXDx30GB',      # ayudas sin personaje: las dice Goma
}
# Vocabulario y frases en inglés: voz nativa estadounidense, clara y algo más lenta, para escuchar
# y pronunciar (Emma, Bright Kids Educator).
VOZ_EL_INGLES = 'oClOrzqamOXmtcB8iqTj'
VELOCIDAD_EL = {'es': 1.0, 'en': 0.9}
# Frases sin personaje que dice el niño o su héroe: siguen con Kokoro.
DEL_NINO = ('¡Hola! Soy ', '¡Sí, vamos!', '¿Cómo me muevo?', 'I can do it!', 'I try again!')


def reunir(cartilla):
    """Devuelve {'es': set(textos), 'en': set(textos)} con lo que la app dice en voz alta."""
    textos = {'es': set(), 'en': set()}
    quien = {}

    def ver(o, clave=''):
        if isinstance(o, dict):
            es, en = o.get('es'), o.get('en')
            if isinstance(es, str) and isinstance(en, str):
                if 'icono' in o or 'pronuncia' in o:
                    textos['en'].add(en)          # el vocabulario siempre suena en inglés
                else:
                    textos['es'].add(es)          # la historia y las ayudas, en español
                    quien.setdefault(es.strip(), o.get('quien'))
            if isinstance(o.get('frase'), str):
                textos['en'].add(o['frase'])
            for k, v in o.items():
                # El índice de voz no se lee a sí mismo; los nombres de accesorios no se dicen.
                if k not in ('voz', 'accesorios'):
                    ver(v, k)
        elif isinstance(o, list):
            for v in o:
                ver(v, clave)

    ver(cartilla)
    return {k: {t.strip() for t in v if t.strip()} for k, v in textos.items()}, quien


def voz_el(idioma, texto, quien):
    """voice_id de ElevenLabs para esta frase, o None si va con Kokoro."""
    if not os.environ.get('ELEVENLABS_API_KEY'):
        return None
    if idioma == 'en':
        return VOZ_EL_INGLES
    q = quien.get(texto)
    if q is None and texto.startswith(DEL_NINO):
        return None
    return VOCES_EL.get(q) if q in VOCES_EL else None


def generar_el(voice_id, texto, destino, idioma='es'):
    pedido = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128',
        data=json.dumps({'text': texto, 'model_id': MODELO_EL, 'language_code': idioma,
                         'voice_settings': {'speed': VELOCIDAD_EL[idioma]}}).encode(),
        headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'Content-Type': 'application/json'})
    with urllib.request.urlopen(pedido, timeout=120) as r, tempfile.NamedTemporaryFile(suffix='.mp3') as tmp:
        tmp.write(r.read()); tmp.flush()
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-af',
                        'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2',
                        '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '32k', str(destino)], check=True)


def nombre(idioma, texto, voice_id=None):
    if voice_id:
        vel = f'@{VELOCIDAD_EL[idioma]}' if idioma == 'en' else ''
        return f"{idioma}-{hashlib.sha1(f'el:{MODELO_EL}:{voice_id}{vel}|{texto}'.encode()).hexdigest()[:12]}.mp3"
    return f"{idioma}-{hashlib.sha1((f'{VOCES[idioma][0]}@{VOCES[idioma][2]}|' + texto).encode()).hexdigest()[:12]}.mp3"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('carpeta', type=Path, help='carpeta de la cartilla (donde está cartilla.json)')
    ap.add_argument('--voces', type=Path, help='carpeta con kokoro-v1.0.onnx y voices-v1.0.bin')
    a = ap.parse_args()
    cartilla = json.loads((a.carpeta / 'cartilla.json').read_text(encoding='utf-8'))
    salida = a.carpeta / 'voz'
    salida.mkdir(exist_ok=True)
    indice, usados, nuevos, motor = {}, set(), 0, None
    todos, quien = reunir(cartilla)
    for idioma, textos in todos.items():
        voz, codigo, velocidad = VOCES[idioma]
        indice[idioma] = {}
        for texto in sorted(textos):
            vid = voz_el(idioma, texto, quien)
            archivo = nombre(idioma, texto, vid)
            indice[idioma][texto] = 'voz/' + archivo
            usados.add(archivo)
            if (salida / archivo).exists():
                continue
            if vid:
                generar_el(vid, texto, salida / archivo, idioma)
                nuevos += 1
                continue
            if not a.voces:
                sys.exit(f'Falta --voces (Kokoro) para generar: {texto!r}')
            import soundfile
            from kokoro_onnx import Kokoro
            motor = motor or Kokoro(str(a.voces / 'kokoro-v1.0.onnx'), str(a.voces / 'voices-v1.0.bin'))
            with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
                audio, tasa = motor.create(texto, voice=voz, speed=velocidad, lang=codigo)
                soundfile.write(tmp.name, audio, tasa)
                # Mono, 32 kbps: suficiente para voz y liviano. Se recorta el silencio del final.
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-af',
                                'areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2',
                                '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '32k', str(salida / archivo)], check=True)
            nuevos += 1
    for viejo in salida.glob('*.mp3'):
        if viejo.name not in usados:
            viejo.unlink()
    cartilla['voz'] = indice
    (a.carpeta / 'cartilla.json').write_text(json.dumps(cartilla, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    peso = sum(f.stat().st_size for f in salida.glob('*.mp3'))
    print(f'{len(usados)} frases ({nuevos} nuevas), {peso / 1024:.0f} KB en {salida}')


if __name__ == '__main__':
    sys.exit(main())
