#!/usr/bin/env python3
"""Pinta el suelo de la página 1 de Postales: papel de cuaderno, caminos de crayola y pasto.

Usa los mismos CAMINOS y LUGARES que construir_pagina.py, así lo que se ve coincide con lo que
se camina. Los edificios, árboles y demás van encima como piezas aparte (objetos del mundo).

Uso: python3 -I herramientas/pintar_pagina.py salida.png
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from construir_pagina import ANCHO_IMG, ALTO_IMG, CAMINOS, LUGARES  # noqa: E402

random.seed(7)
W, H = ANCHO_IMG, ALTO_IMG
COLOR = {'azul-arriba': (86, 150, 222), 'azul-bajada': (86, 150, 222), 'morado': (160, 120, 205), 'amarillo': (246, 199, 68),
         'rosado': (240, 140, 160), 'naranja': (245, 160, 80), 'verde': (110, 190, 120), 'pozo': (86, 150, 222)}
ANCHO_CAMINO = 46  # en la imagen


def p(x, y):
    return (x / 1000 * W, y / 1000 * H)


def suave(puntos, pasos=12):
    """Curva Catmull-Rom por los puntos calcados."""
    pts = [puntos[0]] + puntos + [puntos[-1]]
    salida = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(pasos):
            t = k / pasos
            salida.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in range(2)))
    salida.append(pts[-2])
    return salida


def papel():
    im = Image.new('RGB', (W, H), (251, 246, 236))
    d = ImageDraw.Draw(im)
    for y in range(90, H, 64):
        d.line([(0, y), (W, y)], fill=(214, 224, 238), width=2)
    d.line([(110, 0), (110, H)], fill=(238, 190, 190), width=3)
    ruido = Image.effect_noise((W, H), 14).convert('L')
    grano = Image.merge('RGB', [ruido] * 3)
    return Image.blend(im, Image.composite(im, grano, Image.new('L', (W, H), 235)), 0.25)


def crayola(capa, puntos, color, ancho):
    d = ImageDraw.Draw(capa, 'RGBA')
    borde = tuple(int(c * 0.7) for c in color)
    d.line(puntos, fill=borde + (150,), width=int(ancho * 1.08), joint='curve')
    d.line(puntos, fill=color + (215,), width=int(ancho * 0.92), joint='curve')
    claro = tuple(min(255, int(c * 1.15 + 25)) for c in color)
    for pasada in range(26):
        desv = (random.uniform(-0.35, 0.35) * ancho, random.uniform(-0.35, 0.35) * ancho)
        a = random.randint(20, 45)
        linea = [(x + desv[0] + random.uniform(-2, 2), y + desv[1] + random.uniform(-2, 2)) for x, y in puntos]
        d.line(linea, fill=(claro if pasada % 2 else borde) + (a,), width=int(ancho * random.uniform(0.15, 0.35)), joint='curve')


def main():
    salida = sys.argv[1]
    base = papel().convert('RGBA')
    dp = ImageDraw.Draw(base, 'RGBA')
    for (cx, cy), r in LUGARES.values():
        x, y = p(cx, cy)
        rr = r / 1.4  # el radio de LUGARES está en el mundo
        for _ in range(140):
            ang, dist = random.uniform(0, 2 * math.pi), rr * math.sqrt(random.random())
            px, py = x + dist * math.cos(ang), y + dist * math.sin(ang) * 0.8
            s = random.uniform(12, 30)
            dp.ellipse([px - s, py - s * 0.7, px + s, py + s * 0.7], fill=random.choice([(140, 200, 110), (120, 185, 95), (165, 215, 130)]) + (random.randint(60, 110),))
    # Se pinta directo sobre el papel (opaco) para que cada pasada de crayola se mezcle bien.
    for nombre, linea in CAMINOS.items():
        crayola(base, suave([p(*q) for q in linea]), COLOR[nombre], ANCHO_CAMINO * (0.8 if nombre == 'pozo' else 1))
    # Raya blanca discontinua en el centro, como en el boceto.
    dr = ImageDraw.Draw(base, 'RGBA')
    for nombre, linea in CAMINOS.items():
        pts = suave([p(*q) for q in linea], 24)
        largo = 0
        for a, b in zip(pts, pts[1:]):
            seg = math.dist(a, b)
            if int(largo / 22) % 2 == 0:
                dr.line([a, b], fill=(255, 255, 255, 200), width=5)
            largo += seg
    base.convert('RGB').save(salida)
    print('listo', salida)


if __name__ == '__main__':
    main()
