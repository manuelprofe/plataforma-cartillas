#!/usr/bin/env python3
"""Genera la voz de una cartilla como archivos de audio, una sola vez.

Lee `cartilla.json`, reúne todo lo que la app dice en voz alta y lo convierte a MP3 con
Piper (voz neuronal que corre en este computador; no envía nada a internet). Deja los
archivos en `voz/` junto a la cartilla y anota en `cartilla.json` el índice `voz`
(idioma -> texto -> archivo). La app busca cada frase ahí; si no está, usa la voz del navegador.
Correrlo después de `construir_bosque.py` cada vez que cambien los textos.

Uso (desde la raíz del proyecto):
    pip install piper-tts            # y tener ffmpeg instalado
    python3 herramientas/generar_voz.py public/cartillas/ingles-3 --voces <carpeta con los .onnx>

Voces (se descargan de https://huggingface.co/rhasspy/piper-voices):
    es_MX-claude-high   (español latino; licencia Apache 2.0)
    en_US-ljspeech-high (inglés; dominio público)
Solo se generan las frases nuevas o cambiadas; las que ya no se usan se borran.
"""
import argparse, hashlib, json, subprocess, sys, tempfile, wave
from pathlib import Path

VOCES = {'es': ('es_MX-claude-high', 1.08), 'en': ('en_US-ljspeech-high', 1.15)}  # (modelo, lentitud)


def reunir(cartilla):
    """Devuelve {'es': set(textos), 'en': set(textos)} con lo que la app dice en voz alta."""
    textos = {'es': set(), 'en': set()}

    def ver(o, clave=''):
        if isinstance(o, dict):
            es, en = o.get('es'), o.get('en')
            if isinstance(es, str) and isinstance(en, str):
                if 'icono' in o or 'pronuncia' in o:
                    textos['en'].add(en)          # el vocabulario siempre suena en inglés
                else:
                    textos['es'].add(es)          # la historia y las ayudas, en español
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
    return {k: {t.strip() for t in v if t.strip()} for k, v in textos.items()}


def nombre(idioma, texto):
    return f"{idioma}-{hashlib.sha1((VOCES[idioma][0] + '|' + texto).encode()).hexdigest()[:12]}.mp3"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('carpeta', type=Path, help='carpeta de la cartilla (donde está cartilla.json)')
    ap.add_argument('--voces', type=Path, required=True, help='carpeta con los modelos .onnx de Piper')
    a = ap.parse_args()
    from piper import PiperVoice, SynthesisConfig

    cartilla = json.loads((a.carpeta / 'cartilla.json').read_text(encoding='utf-8'))
    salida = a.carpeta / 'voz'
    salida.mkdir(exist_ok=True)
    indice, usados, nuevos = {}, set(), 0
    for idioma, textos in reunir(cartilla).items():
        modelo, lentitud = VOCES[idioma]
        voz = None
        indice[idioma] = {}
        for texto in sorted(textos):
            archivo = nombre(idioma, texto)
            indice[idioma][texto] = 'voz/' + archivo
            usados.add(archivo)
            if (salida / archivo).exists():
                continue
            voz = voz or PiperVoice.load(str(a.voces / f'{modelo}.onnx'))
            with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
                with wave.open(tmp.name, 'wb') as w:
                    voz.synthesize_wav(texto, w, syn_config=SynthesisConfig(length_scale=lentitud))
                # Mono, 24 kbps: suficiente para voz y liviano. Se recorta el silencio del final.
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-af',
                                'areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2',
                                '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '24k', str(salida / archivo)], check=True)
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
