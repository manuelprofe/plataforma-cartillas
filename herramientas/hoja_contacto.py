"""Hoja de contacto de las láminas. Uso: python3 herramientas/hoja_contacto.py carpeta_materiales salida.webp [ancho_celda]"""
import sys
from PIL import Image
src, dest = sys.argv[1], sys.argv[2]; c = int(sys.argv[3]) if len(sys.argv) > 3 else 300
names = [f"colores/{n}" for n in "red blue green yellow orange purple pink brown black white".split()] + [f"numeros/{n}" for n in range(1, 11)]
cols = 5; rows = 4
sheet = Image.new("RGBA", (cols*c, rows*c), (232, 240, 250, 255))
for i, n in enumerate(names):
    im = Image.open(f"{src}/{n}.webp").convert("RGBA").resize((c, c), Image.LANCZOS)
    sheet.alpha_composite(im, ((i % cols)*c, (i//cols)*c))
sheet.convert("RGB").save(dest, "WEBP", quality=80)
