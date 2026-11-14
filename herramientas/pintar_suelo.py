"""Pinta el suelo del Bosque de los Sonidos por capas, como un mapa de estudio de juegos.

Toma la topología del suelo anterior (plaza, claros, caminos, agua) y la pinta con texturas
y detalles generados en Canva, a resolución real (2800 px), para que se vea nítido a 390 px.
Las imágenes de Canva se generan a 1264 px cuando se pide "repintar este mapa", y a 2048 px
cuando se pide una textura; por eso el mapa se compone aquí y no se genera entero en Canva.

Entradas (exportadas en PNG desde el diseño de Canva DAHa3hWc7ik, una página por imagen):
  carpeta_dl/suelo-actual.png  suelo anterior, 2800 px (Canva MAHau81HHYQ): da la topología
  carpeta_dl/t-bosque.png      textura del bosque, 2048 px (MAHa3h_Sw2Y)
  carpeta_dl/t-prado.png       prado de los claros (MAHa3urYYSY)
  carpeta_dl/t-camino.png      tierra de los caminos (MAHa3kug_H4)
  carpeta_dl/t-agua.png        agua (MAHa3o9Cjdk)
  carpeta_dl/t-empedrado.png   anillo de la plaza (MAHa3uKbHWg)
  carpeta_det/d-1..22.webp     hoja de detalles (MAHa3pKrmTc) recortada con recortar.py, ancho 300
  carpeta_pte/p-1.webp         puente (MAHa3kczy-E) recortado con recortar.py, ancho 1600

Uso: pintar_suelo.py carpeta_dl carpeta_det carpeta_pte salida.png
Después: construir_bosque.py salida.png cartilla.json, y la salida reducida a 2000 px en WebP
(calidad 50) es fondos/bosque-mapa.webp. El resultado de noviembre de 2026 está en Canva
como MAHa545H3F0.
"""
import math
import random
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

DL, DET, PTE, SALIDA = sys.argv[1:5]
W = 2800
rng = np.random.default_rng(7)
random.seed(7)


def f(a):
    return np.asarray(a, dtype=np.float32)


def ruido(escala, semilla, octavas=3):
    """Ruido suave en [-1, 1]."""
    g = np.random.default_rng(semilla)
    total = np.zeros((W, W), np.float32)
    amp, suma = 1.0, 0.0
    for o in range(octavas):
        n = max(2, int(W / escala * 2 ** o))
        im = Image.fromarray(g.random((n, n)).astype(np.float32), 'F').resize((W, W), Image.BICUBIC)
        total += f(im) * amp
        suma += amp
        amp *= 0.5
    total /= suma
    return (total - total.mean()) / (np.abs(total - total.mean()).max() + 1e-6)


def desenfocar(m, r):
    """Desenfoque de una máscara en [0, 1] (en L; los radios grandes se hacen a menor escala)."""
    im = Image.fromarray(np.clip(m * 255, 0, 255).astype(np.uint8), 'L')
    if r >= 16:
        k = 4
        im = im.resize((W // k, W // k), Image.BILINEAR).filter(ImageFilter.GaussianBlur(r / k)).resize((W, W), Image.BICUBIC)
    else:
        im = im.filter(ImageFilter.GaussianBlur(r))
    return f(im) / 255


def textura(nombre, escala, ajuste=None):
    """Textura repetida en todo el mapa, con las costuras disimuladas."""
    t = Image.open(f'{DL}/t-{nombre}.png').convert('RGB')
    if escala != 1:
        t = t.resize((round(t.width * escala), round(t.height * escala)), Image.LANCZOS)
    a = f(t)
    n = a.shape[0]
    # Costura: mezcla con una copia corrida media vuelta, que domina cerca de los bordes.
    eje = np.minimum(np.arange(n), n - 1 - np.arange(n)) / (n / 2)
    peso = np.clip(np.minimum.outer(eje, eje) * 3.2, 0, 1)[..., None]
    corrida = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
    a = a * peso + corrida * (1 - peso)
    reps = math.ceil(W / n) + 1
    grande = np.tile(a, (reps, reps, 1))
    dx, dy = rng.integers(0, n, 2)
    grande = grande[dy:dy + W, dx:dx + W]
    if ajuste is not None:
        grande = grande * np.array(ajuste, np.float32)
    return grande


# ---------- Topología del suelo anterior ----------
viejo = Image.open(f'{DL}/suelo-actual.png').convert('RGB')
N = 700
px = viejo.resize((N, N)).load()


def clase_celda(i, j):  # la misma regla que construir_bosque.py usaba con el suelo anterior
    r, g, b = px[i, j]
    if b > 140 and b > r + 40 and b > g:
        return 'agua'
    if r > 165 and g > 125 and r > b + 55 and r >= g - 10:
        return 'camino'
    if g > 150 and r > 115 and b < 110:
        return 'claro'
    return 'bosque'


C = np.array([[clase_celda(i, j) for i in range(N)] for j in range(N)])
m_agua = (C == 'agua').astype(np.float32)
m_cam = (C == 'camino').astype(np.float32)
m_cla = (C == 'claro').astype(np.float32)

# Río bajo el puente: se interpola la orilla entre la fila de arriba y la de abajo.
E = W / N
fa, fb = int(1238 / E), int(1425 / E)
def orillas(fila):
    xs = np.nonzero(m_agua[fila, int(2300 / E):])[0] + int(2300 / E)
    return xs.min(), xs.max()
(a0, a1), (b0, b1) = orillas(fa), orillas(fb)
for j in range(fa, fb + 1):
    t = (j - fa) / (fb - fa)
    i0, i1 = round(a0 + (b0 - a0) * t), round(a1 + (b1 - a1) * t)
    m_agua[j, i0:i1 + 1] = 1
    m_cam[j, i0:i1 + 1] = 0
m_cam = np.where(m_agua > 0, 0, m_cam)


def solo_grandes(m, minimo):
    """Deja solo las manchas grandes (quita hongos y piedras del suelo anterior que parecían camino o agua)."""
    from collections import deque
    vis = np.zeros(m.shape, bool)
    out = np.zeros_like(m)
    for j in range(N):
        for i in range(N):
            if m[j, i] and not vis[j, i]:
                cola, cel = deque([(i, j)]), []
                vis[j, i] = True
                while cola:
                    a, b = cola.popleft(); cel.append((a, b))
                    for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        u, v = a + da, b + db
                        if 0 <= u < N and 0 <= v < N and m[v, u] and not vis[v, u]:
                            vis[v, u] = True; cola.append((u, v))
                if len(cel) >= minimo:
                    for a, b in cel:
                        out[b, a] = 1
    return out


m_cam = solo_grandes(m_cam, 400)
m_agua = solo_grandes(m_agua, 300)


def a_mapa(m, suave, borde, semilla, amp=0.18, umbral=0.5):
    """Máscara de 700 a 2800 con orilla orgánica: suavizada, con ruido y un borde fino."""
    g = f(Image.fromarray((m * 255).astype(np.uint8)).resize((W, W), Image.BILINEAR)) / 255
    g = desenfocar(g, suave)
    g = g + ruido(90, semilla, 3) * amp
    return np.clip((g - umbral) / borde + 0.5, 0, 1)


A_AGUA = a_mapa(m_agua, 9, 0.05, 11, 0.12)
# Caminos más anchos que antes (se umbraliza más abajo de la mitad): se ven transitables.
A_CAM = a_mapa(m_cam, 14, 0.06, 12, 0.10, umbral=0.24)
# Claros y plaza: círculos limpios en el centro de cada claro anterior, con orilla orgánica.
claros_info = []
vis = np.zeros_like(m_cla, bool)
from collections import deque
for j in range(N):
    for i in range(N):
        if m_cla[j, i] and not vis[j, i]:
            cola, cel = deque([(i, j)]), []
            vis[j, i] = True
            while cola:
                a, b = cola.popleft(); cel.append((a, b))
                for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    u, v = a + da, b + db
                    if 0 <= u < N and 0 <= v < N and m_cla[v, u] and not vis[v, u]:
                        vis[v, u] = True; cola.append((u, v))
            if len(cel) > 600:
                cel = np.array(cel)
                claros_info.append((cel[:, 0].mean() * E + E / 2, cel[:, 1].mean() * E + E / 2, math.sqrt(len(cel) / math.pi) * E))
yy, xx = np.mgrid[0:W, 0:W].astype(np.float32)
borde_n = ruido(70, 13, 2)
A_CLA = np.zeros((W, W), np.float32)
for (x0, y0, r) in claros_info:
    d = np.hypot(xx - x0, yy - y0) + borde_n * 9
    A_CLA = np.maximum(A_CLA, np.clip((r + 4 - d) / 3, 0, 1))
A_CAM = A_CAM * (1 - A_AGUA)
A_CLA = A_CLA * (1 - A_AGUA)
ABIERTO = np.clip(A_CAM + A_CLA + A_AGUA, 0, 1)

# ---------- Bosque ----------
bosque = textura('bosque', 0.5, (1.5, 1.5, 1.35))
bosque = bosque * 0.72 + bosque.mean((0, 1)) * 0.28  # menos contraste: rico pero tranquilo
# Manchas de luz y de tono: unas zonas más amarillas, otras más frescas.
luz = ruido(700, 21, 3)
tono = ruido(900, 22, 2)
bosque *= (1 + 0.12 * luz)[..., None]
bosque[..., 0] *= 1 + 0.10 * tono
bosque[..., 2] *= 1 - 0.10 * tono
# Labio de pasto soleado en el borde del bosque que da a lo abierto.
cerca = desenfocar(ABIERTO, 18)
labio = np.clip(cerca * 2.2, 0, 1) * (1 - ABIERTO)
bosque = bosque * (1 + 0.28 * labio[..., None]) + labio[..., None] * np.array([18, 22, 0], np.float32)

# ---------- Camino ----------
camino = textura('camino', 0.55, (1.0, 1.0, 1.0))
camino *= (1 + 0.06 * ruido(400, 31, 2))[..., None]
# Sombra suave donde el pasto se asoma sobre el camino.
sombra_cam = np.clip(desenfocar(1 - A_CAM, 10) * 1.6, 0, 1) * A_CAM
camino *= (1 - 0.22 * sombra_cam)[..., None]
gastado = np.clip(desenfocar(A_CAM, 9) * 1.6 - 0.6, 0, 1)
camino *= (1 + 0.07 * gastado)[..., None]

# ---------- Claros ----------
prado = textura('prado', 0.32, (1.3, 1.1, 1.0))
prado = prado * 0.58 + prado.mean((0, 1)) * 0.42 * 1.06  # más plano y luminoso: se lee de lejos y en penumbra
centro_cla = desenfocar(A_CLA, 60)
prado *= (1 + 0.16 * np.clip(centro_cla * 1.4 - 0.4, 0, 1))[..., None]  # más luz al centro
prado *= (1 + 0.05 * ruido(300, 41, 2))[..., None]
sombra_cla = np.clip(desenfocar(1 - A_CLA - A_CAM, 12) * 1.5, 0, 1) * A_CLA
prado *= (1 - 0.18 * sombra_cla)[..., None]

# ---------- Agua ----------
agua = textura('agua', 0.5, (0.62, 0.74, 1.0))
agua = agua * 0.75 + agua.mean((0, 1)) * 0.25  # reflejos más suaves: se lee como agua de lejos
hondo = desenfocar(A_AGUA, 40)
agua *= (1 - 0.30 * np.clip(hondo * 1.5 - 0.5, 0, 1))[..., None]
espuma = np.clip(desenfocar(1 - A_AGUA, 4) * 2.5, 0, 1) * A_AGUA
agua = agua * (1 - 0.45 * espuma[..., None]) + espuma[..., None] * np.array([225, 240, 255], np.float32) * 0.45
# Orilla húmeda, un poco más oscura y terrosa, fuera del agua.
orilla = np.clip(desenfocar(A_AGUA, 9) * 2.0, 0, 1) * (1 - A_AGUA)

# ---------- Mezcla ----------
img = bosque
img = img * (1 - A_CAM[..., None]) + camino * A_CAM[..., None]
# Contorno del claro: una sombra fina en el bosque que lo rodea, para que la forma se lea.
contorno = np.clip(desenfocar(A_CLA, 7) * 2.4, 0, 1) * (1 - A_CLA) * (1 - A_CAM)
img = img * (1 - 0.38 * contorno[..., None])
img = img * (1 - A_CLA[..., None]) + prado * A_CLA[..., None]
arena = np.clip(desenfocar(A_AGUA, 7) * 3.0, 0, 1) * (1 - A_AGUA)
img = img * (1 - arena[..., None] * 0.75) + arena[..., None] * 0.75 * camino * np.array([0.9, 0.88, 0.85], np.float32)
humedo = np.clip(desenfocar(A_AGUA, 3) * 3.0, 0, 1) * (1 - A_AGUA)
img = img * (1 - 0.35 * humedo[..., None])
img = img * (1 - A_AGUA[..., None]) + agua * A_AGUA[..., None]

# Plaza: anillo de piedra alrededor del claro central.
cy, cx = 1360, 1388
dist = np.hypot(xx - cx, yy - cy) + ruido(60, 51, 2) * 6
R0, R1 = 238, 292
anillo = np.clip((dist - R0) / 3, 0, 1) * np.clip((R1 - dist) / 3, 0, 1)
# Entradas: donde llega un camino, el empedrado se abre en tierra apisonada.
entrada = np.clip(desenfocar(A_CAM * (dist > R1 + 10) * (dist < R1 + 120), 22) * 4 - 0.4, 0, 1)
anillo = anillo * (1 - entrada)
piedra = textura('empedrado', 0.12, (1.18, 1.04, 0.86))
img = img * (1 - anillo[..., None]) + piedra * anillo[..., None]
sombra_anillo = np.clip(1 - np.abs(dist - R1) / 10, 0, 1) * (dist > R1)
img *= (1 - 0.25 * sombra_anillo)[..., None]

img = np.clip(img, 0, 255).astype(np.uint8)
lienzo = Image.fromarray(img, 'RGB').convert('RGBA')

# ---------- Detalles ----------
def limpiar(s):
    """Quita el halo blanco de la hoja de figuras, de afuera hacia adentro."""
    a = np.asarray(s).astype(np.float32).copy()
    blanco = (a[..., :3].min(-1) > 150) & (a[..., :3].max(-1) - a[..., :3].min(-1) < 55)
    al = a[..., 3]
    for _ in range(16):
        menor = f(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(3)))
        al = np.where(blanco & (menor < al), menor, al)
    al = f(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7)))
    a[..., 3] = al
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


figs = {i: limpiar(Image.open(f'{DET}/d-{i}.webp').convert('RGBA')) for i in range(1, 23)}
# Charcos: un poco verdosos, para que el guion no los confunda con agua.
for i in (17, 18, 19):
    a = np.asarray(figs[i]).astype(np.float32).copy()
    a[..., 2] = np.minimum(a[..., 2], a[..., 1] * 0.98)
    figs[i] = Image.fromarray(a.astype(np.uint8), 'RGBA')

GRUPOS = {
    'flor': ([1, 2, 3, 4, 5, 6], (62, 86)),
    'piedra': ([7, 8, 9, 10], (58, 92)),
    'hongo': ([11, 12, 13], (54, 74)),
    'raiz': ([14, 16], (120, 150)),
    'charco': ([17, 18, 19], (66, 90)),
    'helecho': ([20, 21, 22], (70, 100)),
}
abierto_lejos = desenfocar(ABIERTO, 6)
puestos = []


def libre(x, y, r, minimo):
    return all(math.hypot(x - a, y - b) > r + c + minimo for a, b, c in puestos)


def poner(tipo, x, y, ancho=None, rot=True):
    ids, (w0, w1) = GRUPOS[tipo]
    s = figs[random.choice(ids)]
    ancho = ancho or random.randint(w0, w1)
    s = s.resize((ancho, round(s.height * ancho / s.width)), Image.LANCZOS)
    if random.random() < 0.5:
        s = s.transpose(Image.FLIP_LEFT_RIGHT)
    if rot and tipo in ('raiz', 'helecho', 'charco'):
        s = s.rotate(random.uniform(-40, 40), expand=True, resample=Image.BICUBIC)
    # Sombra suave hacia abajo a la derecha (luz de arriba a la izquierda).
    al = s.split()[3]
    sombra = Image.new('RGBA', s.size, (20, 30, 10, 0))
    sombra.putalpha(al.point(lambda v: int(v * 0.38)).filter(ImageFilter.GaussianBlur(4)))
    ox, oy = int(x - s.width / 2), int(y - s.height / 2)
    lienzo.alpha_composite(sombra, (ox + 5, oy + 7))
    lienzo.alpha_composite(s, (ox, oy))
    puestos.append((x, y, ancho / 2))


def fuera_de_lo_abierto(x, y, r):
    for dx, dy in ((0, 0), (r, 0), (-r, 0), (0, r), (0, -r), (r * .7, r * .7), (-r * .7, r * .7), (r * .7, -r * .7), (-r * .7, -r * .7)):
        u, v = int(x + dx), int(y + dy)
        if not (0 <= u < W and 0 <= v < W) or abierto_lejos[v, u] > 0.03:
            return False
    return True


# 1) Corona de flores, piedras planas y hongos alrededor de cada claro: invitan a entrar.
for (x0, y0, r) in claros_info:
    if r > 200:
        continue  # la plaza ya tiene su anillo de piedra
    pasos = int(2 * math.pi * (r + 40) / 46)
    for k in range(pasos):
        ang = 2 * math.pi * k / pasos + random.uniform(-0.05, 0.05)
        d = r + random.uniform(34, 58)
        x, y = x0 + math.cos(ang) * d, y0 + math.sin(ang) * d
        if not fuera_de_lo_abierto(x, y, 26) or not libre(x, y, 26, -10):
            continue
        tipo = 'flor' if random.random() < 0.8 else random.choice(('hongo', 'piedra'))
        poner(tipo, x, y, random.randint(52, 70))

# 2) Orilla del río y de los estanques: piedras y helechos.
borde_agua = (orilla > 0.15) & (orilla < 0.6)
ys, xs = np.nonzero(borde_agua[::6, ::6])
orden = rng.permutation(len(xs))
cuenta = 0
for k in orden:
    x, y = xs[k] * 6 + 3, ys[k] * 6 + 3
    if cuenta > 70:
        break
    if not libre(x, y, 40, 30) or A_CAM[int(y), int(x)] > 0.01 or abs(y - 1330) < 110 and x > 2350:
        continue
    poner(random.choice(('piedra', 'piedra', 'helecho')), x, y)
    cuenta += 1

# 2b) Bordes del camino: piedritas y matas de flores que marcan la orilla, sin taparlo.
CAM_S = desenfocar(A_CAM, 8)
borde_cam = (CAM_S > 0.3) & (CAM_S < 0.55) & (desenfocar(A_CLA, 8) < 0.01) & (dist > R1 + 40)
ys, xs = np.nonzero(borde_cam[::5, ::5])
cuenta = 0
for k in rng.permutation(len(xs)):
    x, y = xs[k] * 5 + 2, ys[k] * 5 + 2
    if cuenta > 110:
        break
    if not libre(x, y, 22, 75) or A_AGUA[int(y), int(x)] > 0 or abs(y - 1330) < 120 and x > 2330:
        continue
    # Se corre hacia afuera del camino para que solo asome.
    gy, gx = np.gradient(CAM_S[int(y) - 3:int(y) + 4, int(x) - 3:int(x) + 4])
    n = math.hypot(gx[3, 3], gy[3, 3]) or 1
    x2, y2 = x - gx[3, 3] / n * 14, y - gy[3, 3] / n * 14
    tipo = random.choice(('piedra', 'piedra', 'flor'))
    poner(tipo, x2, y2, random.randint(30, 40) if tipo == 'piedra' else random.randint(40, 50))
    cuenta += 1

# 3) Bosque: grupos pequeños de flores, helechos, hongos, raíces, piedras y algún charco.
pesos = [('flor', 34), ('helecho', 30), ('piedra', 12), ('hongo', 11), ('raiz', 3), ('charco', 3)]
bolsa = [t for t, p in pesos for _ in range(p)]
for _ in range(9000):
    if len(puestos) > 400:
        break
    x, y = random.uniform(40, W - 40), random.uniform(40, W - 40)
    tipo = random.choice(bolsa)
    r = 52 if tipo in ('raiz', 'charco') else 40
    if not fuera_de_lo_abierto(x, y, r + 18) or not libre(x, y, r, 70):
        continue
    poner(tipo, x, y)
    # A veces un compañero pequeño al lado, para que se vean como matas y no como sellos.
    if tipo in ('flor', 'helecho', 'hongo') and random.random() < 0.45:
        ang = random.uniform(0, 2 * math.pi)
        x2, y2 = x + math.cos(ang) * 48, y + math.sin(ang) * 40
        if fuera_de_lo_abierto(x2, y2, 30) and libre(x2, y2, 22, -6):
            poner(tipo, x2, y2, random.randint(42, 56))

# ---------- Puente ----------
p = limpiar(Image.open(f'{PTE}/p-1.webp').convert('RGBA'))
# Ancho del río a la altura del puente, más un tramo sobre cada orilla.
fila = A_AGUA[1330]
xs = np.nonzero(fila[2300:] > 0.5)[0] + 2300
izq, der = xs.min(), xs.max()
largo = int(der - izq + 170)
p = p.resize((largo, round(p.height * largo / p.width)), Image.LANCZOS)
alto_pte = 150
p = p.resize((largo, alto_pte), Image.LANCZOS)
sombra = Image.new('RGBA', p.size, (10, 30, 40, 0))
sombra.putalpha(p.split()[3].point(lambda v: int(v * 0.45)).filter(ImageFilter.GaussianBlur(7)))
px0, py0 = int((izq + der) / 2 - largo / 2), int(1335 - alto_pte / 2)
lienzo.alpha_composite(sombra, (px0 + 8, py0 + 14))
lienzo.alpha_composite(p, (px0, py0))
print('puente', px0, py0, largo, alto_pte, 'río', izq, der)

lienzo.convert('RGB').save(SALIDA)
print('detalles', len(puestos))
