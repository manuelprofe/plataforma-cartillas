# Genera los iconos PNG de la app a partir de Lumi (paquete de la cartilla).
# Uso, desde la raíz del repositorio: python3 scripts/iconos_app.py (requiere Pillow).
from PIL import Image, ImageDraw
src = Image.open('public/cartillas/ingles-3/personajes/lumi-wave.webp').convert('RGBA')
src = src.crop(src.getbbox())
NOCHE = (42, 20, 88, 255)
def icono(lado, fraccion, nombre, redondo):
    fondo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0) if redondo else NOCHE)
    if redondo:
        ImageDraw.Draw(fondo).rounded_rectangle([0, 0, lado - 1, lado - 1], radius=lado // 5, fill=NOCHE)
    m = int(lado * fraccion)
    esc = m / max(src.size)
    im = src.resize((round(src.width * esc), round(src.height * esc)), Image.LANCZOS)
    fondo.alpha_composite(im, ((lado - im.width) // 2, (lado - im.height) // 2))
    fondo.quantize(colors=256, method=Image.FASTOCTREE).save('public/iconos-app/' + nombre, optimize=True)
icono(192, 0.8, 'icono-192.png', True)
icono(512, 0.8, 'icono-512.png', True)
icono(512, 0.62, 'icono-maskable-512.png', False)
icono(180, 0.74, 'apple-touch-icon.png', False)
