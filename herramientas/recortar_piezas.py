#!/usr/bin/env python3
"""Recorta las piezas con volumen (edificios, árboles, puente...) de una hoja de Canva en WebP transparente.

La hoja tiene las piezas en una cuadrícula sobre papel crema liso. En cada celda se rellena el fondo
desde los bordes (todo lo que se parece al papel y toca el borde) y lo demás es la pieza, con su
sombra suave. Se guarda a 2 veces el ancho con que se dibuja en el mundo.

Uso: python3 -I herramientas/recortar_piezas.py hoja.png columnas filas carpeta nombre:ancho [nombre:ancho ...]
     (un nombre por celda, por filas; "-" salta la celda; "nombre:ancho@x0,y0,x1,y1" usa esa caja,
     en fracciones de la hoja, en lugar de la celda)
"""
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

hoja, cols, filas, carpeta, *piezas = sys.argv[1:]
cols, filas = int(cols), int(filas)
im = np.asarray(Image.open(hoja).convert('RGB')).astype(int)
H, W, _ = im.shape
borde = np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3), im[:, :8].reshape(-1, 3), im[:, -8:].reshape(-1, 3)])
papel = np.median(borde, axis=0)
diff = np.abs(im - papel).max(axis=2)
for k, pieza in enumerate(piezas):
    if pieza == '-':
        continue
    nombre, ancho = pieza.split(':')
    if '@' in ancho:
        ancho, caja_txt = ancho.split('@')
        fx0, fy0, fx1, fy1 = map(float, caja_txt.split(','))
        x0, y0, x1, y1 = int(fx0 * W), int(fy0 * H), int(fx1 * W), int(fy1 * H)
    else:
        f, c = divmod(k, cols)
        y0, y1, x0, x1 = f * H // filas, (f + 1) * H // filas, c * W // cols, (c + 1) * W // cols
    d = diff[y0:y1, x0:x1]
    parecido = d < 20
    lab, _ = ndi.label(parecido)
    toca = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    fondo = np.isin(lab, toca[toca > 0])
    obj = ndi.binary_opening(~fondo, iterations=2)
    lab2, n = ndi.label(obj)
    if n == 0:
        print('vacía:', nombre)
        continue
    tam = ndi.sum(obj, lab2, range(1, n + 1))
    # La pieza es la mancha más grande y lo que queda dentro de su caja (no restos de la celda vecina).
    mayor = int(np.argmax(tam)) + 1
    my, mx = np.where(lab2 == mayor)
    centros = ndi.center_of_mass(obj, lab2, range(1, n + 1))
    dentro = [i + 1 for i, (cy, cx) in enumerate(centros)
              if i + 1 == mayor or (tam[i] > 30 and my.min() <= cy <= my.max() and mx.min() <= cx <= mx.max())]
    obj = np.isin(lab2, dentro)
    obj = ndi.binary_fill_holes(obj)
    # Borde suave: el alfa baja donde el color se acerca al papel (sombras y trazos finos).
    alfa = np.clip((d - 8) / 40, 0, 1) * obj
    alfa = np.maximum(alfa, ndi.binary_erosion(obj, iterations=3))
    ys, xs = np.where(obj)
    caja = (xs.min() - 3, ys.min() - 3, xs.max() + 4, ys.max() + 4)
    rgba = Image.fromarray(im[y0:y1, x0:x1].astype(np.uint8)).convert('RGBA')
    rgba.putalpha(Image.fromarray((alfa * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)))
    p = rgba.crop(caja)
    w = int(ancho) * 2
    p = p.resize((w, round(p.height * w / p.width)), Image.LANCZOS)
    p.save(f'{carpeta}/{nombre}.webp', 'WEBP', quality=80, method=6)
    print(nombre, p.size)
