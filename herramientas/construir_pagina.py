#!/usr/bin/env python3
"""Arma la página 1 de Postales (Cuaderno Verde) sobre el mapa dibujado y la escribe en cartilla.json.

El mapa (Canva, "caminos de colores") trae un camino principal azul con ramales de colores hacia
seis lugares. Aquí se calcan esos caminos a mano como líneas, en coordenadas de 0 a 1000 sobre la
imagen; con eso se marca lo caminable (solo los caminos y la explanada de cada lugar, para que el
niño no se pierda dando vueltas), se ponen las misiones en su lugar, los vecinos, las pistas del
piso y los letreros de cada cruce.

Uso: python3 -I herramientas/construir_pagina.py public/cartillas/ingles-3/cartilla.json
Si cambia la imagen del mapa hay que volver a calcar CAMINOS y LUGARES.
"""
import json
import math
import sys

ruta = sys.argv[1]
ANCHO_IMG, ALTO_IMG = 1638, 2048      # tamaño de fondos/pagina-1.webp
ESCALA = 1.4                          # el mundo es 1,4 veces la imagen (como el bosque)
MUNDO_ANCHO, MUNDO_ALTO = round(ANCHO_IMG * ESCALA), round(ALTO_IMG * ESCALA)
CELDA = 20
MEDIO_CAMINO = 70                     # medio ancho de lo caminable sobre cada camino, en el mundo


def P(x, y):
    """Punto calcado (0 a 1000 sobre la imagen) a coordenadas del mundo."""
    return (round(x / 1000 * MUNDO_ANCHO), round(y / 1000 * MUNDO_ALTO))


# Caminos dibujados, calcados sobre la imagen. El azul es el principal.
CAMINOS = {
    'azul-arriba': [(110, 300), (250, 312), (330, 338), (420, 330), (500, 305), (570, 330), (610, 368), (680, 330), (800, 300), (900, 265), (932, 215)],
    'azul-bajada': [(390, 345), (450, 412), (410, 460), (385, 520), (430, 560), (520, 585), (590, 640), (570, 715), (490, 760), (420, 800), (330, 835), (230, 880), (155, 912)],
    'morado': [(490, 760), (530, 805), (610, 840), (700, 850), (780, 868), (860, 915)],
    'amarillo': [(500, 305), (565, 275), (610, 235), (615, 195)],
    'rosado': [(250, 312), (215, 262), (205, 225)],
    'naranja': [(330, 835), (320, 790), (300, 720)],
    'verde': [(680, 330), (760, 400), (800, 470), (795, 560), (830, 620), (815, 690), (760, 725), (715, 735)],
    'pozo': [(450, 412), (500, 445)],
}
# Explanada de cada lugar: centro calcado y radio en el mundo.
LUGARES = {
    'escuela': ((205, 230), 190), 'colores': ((505, 205), 200), 'numeros': ((810, 215), 190),
    'cuerpo': ((805, 470), 210), 'familia': ((290, 700), 210), 'hora': ((700, 745), 170),
    'pozo': ((500, 455), 150), 'buzon': ((175, 900), 170), 'esquina': ((875, 905), 170),
}

MISIONES = {  # id -> punto calcado
    'bosque-school': (160, 250), 'bosque-school-2': (250, 255), 'bosque-school-3': (205, 285),
    'bosque-colors': (440, 225), 'bosque-colors-2': (530, 232), 'bosque-colors-3': (585, 215),
    'bosque-numbers': (740, 225), 'bosque-numbers-2': (830, 240), 'bosque-numbers-3': (890, 225),
    'bosque-body': (725, 470), 'bosque-body-2': (800, 515), 'bosque-body-3': (875, 470),
    'bosque-family': (200, 720), 'bosque-family-2': (290, 735), 'bosque-family-3': (380, 720),
    'bosque-time': (660, 770), 'bosque-time-2': (745, 770),
    'bosque-pozo': (500, 470),
}
HABITANTES = {  # id -> (punto, punto del encargo o None)
    'goma': ((235, 870), None), 'postal': ((560, 470), None),
    'caro': ((120, 318), (300, 330)), 'tito': ((430, 290), (560, 318)), 'abu': ((925, 260), (830, 300)),
    'pua': ((900, 520), (790, 420)), 'nuez': ((160, 690), (322, 800)), 'rayo': ((790, 800), None),
}
# Piezas con volumen encima del suelo: (imagen en pagina/, ancho en el mundo, punto de apoyo, choque).
# El punto es la base de la pieza: el guía pasa por delante si está más abajo y por detrás si está arriba.
OBJETOS = [
    ('escuela', 280, (205, 200), 90), ('jardin', 280, (505, 190), 90), ('piedras', 270, (810, 195), 80),
    ('parque', 300, (805, 445), 80), ('casas', 330, (290, 672), 100), ('torre', 150, (700, 735), 50),
    ('pozo', 150, (500, 448), 45), ('buzon', 90, (140, 885), 20), ('estanque', 160, (110, 570), 60),
    ('banca', 110, (560, 905), 30), ('puente', 180, (950, 560), 0),
    ('arbol-1', 150, (55, 130), 22), ('arbol-2', 110, (955, 95), 18), ('arbol-3', 150, (380, 120), 22),
    ('arbol-1', 150, (670, 110), 22), ('arbol-2', 110, (60, 450), 18), ('arbol-3', 150, (955, 385), 22),
    ('arbol-1', 150, (250, 470), 22), ('arbol-2', 110, (660, 520), 18), ('arbol-3', 150, (955, 680), 22),
    ('arbol-2', 110, (60, 760), 18), ('arbol-1', 150, (460, 945), 22), ('arbol-2', 110, (960, 820), 18),
    ('arbol-3', 150, (250, 590), 22), ('arbol-2', 110, (690, 600), 18),
    ('arbusto', 110, (120, 210), 0), ('arbusto', 110, (590, 160), 0), ('arbusto', 110, (390, 690), 0),
    ('arbusto', 110, (900, 485), 0), ('tulipanes', 80, (330, 200), 0), ('tulipanes', 80, (720, 190), 0),
    ('tulipanes', 80, (620, 745), 0), ('tulipanes', 80, (240, 905), 0),
]
PUERTA = (880, 895)
INICIO = (205, 905)

# Letreros: en cada cruce, a qué lugares lleva cada lado. El juego los dibuja con el ícono de la
# primera misión de ese lugar; tocar uno lleva al niño hasta allá por el camino.
LETREROS = [
    {'en': (440, 395), 'lleva': ['bosque-school', 'bosque-colors', 'bosque-numbers', 'bosque-body']},
    {'en': (360, 845), 'lleva': ['bosque-family', 'bosque-pozo']},
    {'en': (520, 790), 'lleva': ['bosque-time', 'bosque-pozo']},
    {'en': (250, 345), 'lleva': ['bosque-school']},
    {'en': (520, 330), 'lleva': ['bosque-colors', 'bosque-numbers']},
    {'en': (690, 360), 'lleva': ['bosque-body', 'bosque-numbers']},
]


def distancia_segmento(px, py, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def rejilla():
    columnas, filas = math.ceil(MUNDO_ANCHO / CELDA), math.ceil(MUNDO_ALTO / CELDA)
    tramos_mundo = [[P(*p) for p in linea] for linea in CAMINOS.values()]
    lugares = [(P(*c), r) for c, r in LUGARES.values()]
    salida = []
    for j in range(filas):
        y = j * CELDA + CELDA / 2
        fila = []
        for i in range(columnas):
            x = i * CELDA + CELDA / 2
            libre = any(math.hypot(x - c[0], y - c[1]) < r for c, r in lugares) or any(
                distancia_segmento(x, y, l[k], l[k + 1]) < MEDIO_CAMINO for l in tramos_mundo for k in range(len(l) - 1))
            fila.append('0' if libre else '1')
        # Mismo formato que el bosque: tramos alternos empezando por "no se camina".
        tramos, actual, largo = [], '1', 0
        for c in fila:
            if c == actual:
                largo += 1
            else:
                tramos.append(largo)
                actual, largo = c, 1
        tramos.append(largo)
        salida.append(','.join(map(str, tramos)))
    return {'celda': CELDA, 'ancho': columnas, 'alto': filas, 'filas': salida}


def pistas(t):
    """Tres pistas en el piso del ramal de cada lugar, con el ícono de su primera misión."""
    ramales = {'bosque-school': 'rosado', 'bosque-colors': 'amarillo', 'bosque-family': 'naranja',
               'bosque-body': 'verde', 'bosque-time': 'morado', 'bosque-numbers': 'azul-arriba'}
    iconos = {m['id']: m['icono'] for m in t['misiones']}
    salida = []
    for mision, camino in ramales.items():
        linea = CAMINOS[camino]
        if camino == 'azul-arriba':
            linea = linea[-4:]
        if camino == 'verde':
            linea = linea[:4]
        for f in (0.3, 0.55, 0.8):
            k = min(int(f * (len(linea) - 1)), len(linea) - 2)
            a, b = linea[k], linea[k + 1]
            x, y = P(a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5)
            salida.append({'x': x, 'y': y, 'icono': iconos[mision], 'mision': mision})
    return salida


def main():
    d = json.load(open(ruta, encoding='utf-8'))
    t = d['territorios'][0]
    mundo = t['mundo']
    for m in t['misiones']:
        m['x'], m['y'] = P(*MISIONES[m['id']])
    habitantes = {h['id']: h for h in mundo['habitantes']}
    for hid, (punto, encargo) in HABITANTES.items():
        h = habitantes[hid]
        h['x'], h['y'] = P(*punto)
        if encargo and h.get('encargo'):
            h['encargo']['x'], h['encargo']['y'] = P(*encargo)
    t['puerta']['x'], t['puerta']['y'] = P(*PUERTA)
    # Las criaturas siguen regalando su palabra, ahora repartidas por los lugares.
    sitios = [c for c, _ in LUGARES.values()]
    for i, c in enumerate(mundo['criaturas']):
        cx, cy = sitios[i % len(sitios)]
        c['x'], c['y'] = P(cx + (i % 3 - 1) * 45, cy - 40 + (i // len(sitios)) * 30)
    mundo.update({
        'mapa': 'fondos/pagina-1.webp',
        'ancho': MUNDO_ANCHO, 'alto': MUNDO_ALTO,
        'inicio': dict(zip('xy', P(*INICIO))),
        'arboles': [], 'tiposArbol': [], 'frente': [], 'agua': [], 'luciernagas': [],
        'objetos': [{'imagen': f'pagina/{n}.webp', 'ancho': a, 'x': P(*q)[0], 'y': P(*q)[1], 'choque': c} for n, a, q, c in OBJETOS],
        'luces': [{'x': MUNDO_ANCHO // 2, 'y': MUNDO_ALTO // 2, 'radio': MUNDO_ANCHO + MUNDO_ALTO}],
        'colorPenumbra': 'rgb(0 0 0 / 0)',
        'celda': CELDA,
        'caminable': rejilla(),
        'huellas': pistas(t),
        'letreros': [{'x': P(*l['en'])[0], 'y': P(*l['en'])[1], 'lleva': l['lleva']} for l in LETREROS],
    })
    mundo.pop('ambiente', None)
    json.dump(d, open(ruta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(ruta, 'a').write('\n')
    print(f'Mundo {MUNDO_ANCHO} x {MUNDO_ALTO}, {len(t["misiones"])} misiones, {len(LETREROS)} letreros')


if __name__ == '__main__':
    main()
