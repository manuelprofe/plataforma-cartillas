"""Recorta una hoja de figuras sobre fondo blanco en imágenes sueltas con transparencia.

Uso: recortar.py hoja.png carpeta_salida prefijo ancho_final [alto_util]
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

hoja, salida, prefijo, ancho_final = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
im = Image.open(hoja).convert('RGB')
if len(sys.argv) > 5:
    im = im.crop((0, 0, im.width, int(sys.argv[5])))
# Margen blanco para que el relleno desde la esquina alcance todo el fondo.
lienzo = Image.new('RGB', (im.width + 20, im.height + 20), 'white')
lienzo.paste(im, (10, 10))
im = lienzo

# Fondo = blanco conectado con el borde (lo blanco dentro de una figura se conserva).
marca = im.copy()
ImageDraw.floodfill(marca, (0, 0), (255, 0, 255), thresh=38)
r, g, b = marca.split()
fondo = ImageChops.multiply(
    ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0), b.point(lambda v: 255 if v == 255 else 0)),
    g.point(lambda v: 255 if v == 0 else 0),
)
alfa = ImageChops.invert(fondo)
# Borde: se come un píxel de halo blanco y se suaviza.
alfa = alfa.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

# Componentes: se rellena cada figura con una etiqueta distinta.
etiquetas = alfa.point(lambda v: 255 if v > 40 else 0).convert('L')
cajas = []
px = etiquetas.load()
for y in range(0, etiquetas.height, 12):
    for x in range(0, etiquetas.width, 12):
        if px[x, y] == 255:
            ImageDraw.floodfill(etiquetas, (x, y), 100)
            caja = etiquetas.point(lambda v: 255 if v == 100 else 0).getbbox()
            ImageDraw.floodfill(etiquetas, (x, y), 50)
            if (caja[2] - caja[0]) * (caja[3] - caja[1]) > 9000:
                cajas.append(caja)
            px = etiquetas.load()

# Orden de lectura: por filas y luego por columnas.
alto_medio = sum(c[3] - c[1] for c in cajas) / len(cajas)
cajas.sort(key=lambda c: (round(((c[1] + c[3]) / 2) / alto_medio), c[0]))
rgba = im.convert('RGBA')
rgba.putalpha(alfa)
for i, c in enumerate(cajas):
    figura = rgba.crop((c[0] - 2, c[1] - 2, c[2] + 2, c[3] + 2))
    alto = round(figura.height * ancho_final / figura.width)
    figura = figura.resize((ancho_final, alto), Image.LANCZOS)
    ruta = f'{salida}/{prefijo}-{i + 1}.webp'
    figura.save(ruta, quality=82, method=6)
    print(ruta, figura.size)
