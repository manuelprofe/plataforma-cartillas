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
from collections import deque

ruta = sys.argv[1] if len(sys.argv) > 1 else ''
ANCHO_IMG, ALTO_IMG = 1638, 2048      # tamaño de fondos/pagina-1.webp
ESCALA = 1.4                          # el mundo es 1,4 veces la imagen (como el bosque)
MUNDO_ANCHO, MUNDO_ALTO = round(ANCHO_IMG * ESCALA), round(ALTO_IMG * ESCALA)
CELDA = 20
MEDIO_CAMINO = 70                     # medio ancho de lo caminable sobre cada camino, en el mundo


def P(x, y):
    """Punto calcado (0 a 1000 sobre la imagen) a coordenadas del mundo."""
    return (round(x / 1000 * MUNDO_ANCHO), round(y / 1000 * MUNDO_ALTO))


# Caminos dibujados, calcados sobre la imagen. El azul es el principal; cada lugar tiene el suyo.
# Todos se tocan: el verde baja del parque a la torre y el morado sube de la torre al azul.
CAMINOS = {
    'azul-arriba': [(110, 300), (250, 312), (330, 338), (420, 330), (500, 305), (570, 330), (610, 368), (680, 330)],
    'rojo': [(680, 330), (800, 300), (900, 265), (932, 215)],
    'azul-bajada': [(390, 345), (450, 412), (410, 460), (385, 520), (430, 560), (520, 585), (590, 640), (570, 715), (490, 760), (420, 800), (330, 835), (230, 880), (155, 912)],
    'morado': [(490, 760), (560, 792), (640, 795), (700, 778)],
    'morado-puerta': [(700, 778), (760, 815), (820, 860), (860, 912)],
    'amarillo': [(500, 305), (565, 275), (610, 235), (615, 195)],
    'rosado': [(250, 312), (215, 262), (205, 225)],
    'naranja': [(330, 835), (320, 790), (300, 720)],
    'verde': [(680, 330), (760, 400), (800, 470), (795, 560), (830, 620), (815, 690), (760, 725), (715, 745)],
    'pozo': [(450, 412), (500, 445)],
}
# Atajos: se ven a lápiz y se abren (se colorean y se pueden caminar) al terminar una misión.
ATAJOS = {
    'celeste': {'abre': 'bosque-family-3', 'puntos': [(225, 660), (170, 600), (160, 520), (130, 430), (110, 300)]},
    'cafe': {'abre': 'bosque-body-3', 'puntos': [(870, 500), (930, 545), (950, 600), (930, 700), (900, 800), (875, 880)]},
    'rojo-arriba': {'abre': 'bosque-colors-3', 'puntos': [(580, 205), (660, 180), (740, 200)]},
}
# Nombre que se le dice al niño y color de crayola de cada camino.
COLORES = {
    'azul-arriba': ('azul', (86, 150, 222)), 'azul-bajada': ('azul', (86, 150, 222)), 'pozo': ('azul', (86, 150, 222)),
    'rojo': ('rojo', (226, 92, 84)), 'rojo-arriba': ('rojo', (226, 92, 84)),
    'morado': ('morado', (160, 120, 205)), 'morado-puerta': ('morado', (160, 120, 205)),
    'amarillo': ('amarillo', (246, 199, 68)), 'rosado': ('rosado', (240, 140, 160)),
    'naranja': ('naranja', (245, 160, 80)), 'verde': ('verde', (110, 190, 120)),
    'celeste': ('celeste', (120, 205, 235)), 'cafe': ('café', (176, 122, 76)),
}
# Color del camino propio de cada lugar (el que se nombra en los letreros).
COLOR_LUGAR = {'school': 'rosado', 'colors': 'amarillo', 'numbers': 'rojo', 'body': 'verde', 'family': 'naranja',
               'time': 'morado', 'pozo': 'pozo', 'puente': 'morado-puerta'}
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
    ('pozo', 150, (500, 448), 45), ('buzon', 90, (140, 885), 20), ('estanque', 160, (85, 610), 60),
    ('banca', 110, (560, 905), 30), ('puente', 180, (950, 560), 0),
    ('arbol-1', 150, (55, 130), 22), ('arbol-2', 110, (955, 95), 18), ('arbol-3', 150, (380, 120), 22),
    ('arbol-1', 150, (670, 110), 22), ('arbol-2', 110, (60, 450), 18), ('arbol-3', 150, (955, 385), 22),
    ('arbol-1', 150, (250, 470), 22), ('arbol-2', 110, (660, 520), 18), 
    ('arbol-2', 110, (60, 760), 18), ('arbol-1', 150, (460, 945), 22), ('arbol-2', 110, (960, 820), 18),
    ('arbol-3', 150, (250, 590), 22), ('arbol-2', 110, (690, 600), 18),
    ('arbusto', 110, (120, 210), 0), ('arbusto', 110, (590, 160), 0), ('arbusto', 110, (390, 690), 0),
    ('arbusto', 110, (900, 485), 0), ('tulipanes', 80, (330, 200), 0), ('tulipanes', 80, (720, 190), 0),
    ('tulipanes', 80, (620, 745), 0), ('tulipanes', 80, (240, 905), 0),
]
PUERTA = (880, 895)
INICIO = (205, 905)
# Edificio de cada lugar: se colorea con la primera misión de ese lugar.
EDIFICIO = {'escuela': 'bosque-school', 'jardin': 'bosque-colors', 'piedras': 'bosque-numbers', 'parque': 'bosque-body',
            'casas': 'bosque-family', 'torre': 'bosque-time', 'pozo': 'bosque-pozo', 'puente': 'bosque-body-3'}
# Cosas que aparecen dibujadas al terminar una misión (sin choque, para no cerrar caminos).
APARECEN = [
    ('bosque-school-2', 'tulipanes', 80, (265, 205)), ('bosque-school-3', 'arbusto', 100, (140, 270)),
    ('bosque-colors-2', 'tulipanes', 80, (450, 190)), ('bosque-colors-3', 'arbusto', 100, (560, 255)),
    ('bosque-numbers-2', 'tulipanes', 80, (870, 190)), ('bosque-numbers-3', 'arbol-2', 110, (770, 160)),
    ('bosque-body-2', 'banca', 100, (740, 520)), ('bosque-body-3', 'tulipanes', 80, (860, 430)),
    ('bosque-family-2', 'tulipanes', 80, (220, 760)), ('bosque-family-3', 'banca', 100, (350, 760)),
    ('bosque-time-2', 'tulipanes', 80, (760, 720)), ('bosque-pozo', 'tulipanes', 80, (545, 430)),
]
RADIO_MANCHA = 230   # en el mundo: lo que colorea cada misión alrededor de su punto

# Letreros: en cada cruce, hacia dónde queda cada lugar y el color del camino que hay que buscar.
# 'puente' es la puerta a la página siguiente. El juego dibuja el ícono y una flecha de ese color.
LETREROS = [
    {'en': (265, 845), 'lleva': ['bosque-family', 'bosque-time', 'bosque-school']},
    {'en': (480, 825), 'lleva': ['bosque-time', 'puente', 'bosque-pozo']},
    {'en': (440, 395), 'lleva': ['bosque-school', 'bosque-colors', 'bosque-numbers']},
    {'en': (250, 345), 'lleva': ['bosque-school']},
    {'en': (530, 345), 'lleva': ['bosque-colors', 'bosque-numbers', 'bosque-body']},
    {'en': (690, 365), 'lleva': ['bosque-numbers', 'bosque-body']},
    {'en': (805, 750), 'lleva': ['bosque-body', 'puente']},
]


def distancia_segmento(px, py, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def lineas_mundo(caminos):
    return [[P(*p) for p in linea] for linea in caminos]


def fuera_de_lo_base(x, y):
    """Cuánto le falta a un punto del mundo para tocar lo caminable de base (negativo: está dentro)."""
    d = min(math.hypot(x - c[0], y - c[1]) - r for c, r in ((P(*c), r) for c, r in LUGARES.values()))
    for l in lineas_mundo(CAMINOS.values()):
        for k in range(len(l) - 1):
            d = min(d, distancia_segmento(x, y, l[k], l[k + 1]) - MEDIO_CAMINO)
    return d


def libres(con_atajos):
    """Matriz de celdas caminables: los caminos, los atajos (si se piden) y la explanada de cada lugar."""
    columnas, filas = math.ceil(MUNDO_ANCHO / CELDA), math.ceil(MUNDO_ALTO / CELDA)
    caminos = list(CAMINOS.values()) + ([a['puntos'] for a in ATAJOS.values()] if con_atajos else [])
    tramos_mundo = lineas_mundo(caminos)
    lugares = [(P(*c), r) for c, r in LUGARES.values()]
    matriz = []
    for j in range(filas):
        y = j * CELDA + CELDA / 2
        matriz.append([any(math.hypot(i * CELDA + CELDA / 2 - c[0], y - c[1]) < r for c, r in lugares) or any(
            distancia_segmento(i * CELDA + CELDA / 2, y, l[k], l[k + 1]) < MEDIO_CAMINO for l in tramos_mundo for k in range(len(l) - 1))
            for i in range(columnas)])
    return matriz


def rejilla(matriz):
    salida = []
    for fila in matriz:
        # Mismo formato que el bosque: tramos alternos empezando por "no se camina".
        tramos, actual, largo = [], False, 0
        for c in fila:
            if c == actual:
                largo += 1
            else:
                tramos.append(largo)
                actual, largo = c, 1
        tramos.append(largo)
        salida.append(','.join(map(str, tramos)))
    return {'celda': CELDA, 'ancho': len(matriz[0]), 'alto': len(matriz), 'filas': salida}


def bloqueos_de(puntos):
    """Dos tapones por atajo, justo donde deja lo caminable de base: lo del medio queda aislado."""
    linea = lineas_mundo([puntos])[0]
    muestras = []
    for a, b in zip(linea, linea[1:]):
        n = max(1, int(math.dist(a, b) // 20))
        muestras += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n)]
    muestras.append(linea[-1])
    radio = MEDIO_CAMINO + 15
    tapones = []
    for orden in (muestras, muestras[::-1]):
        q = next(q for q in orden if fuera_de_lo_base(*q) > radio + 10)
        tapones.append({'x': round(q[0]), 'y': round(q[1]), 'r': radio})
    return tapones


def celda_libre_cercana(matriz, x, y):
    i0, j0 = int(x // CELDA), int(y // CELDA)
    mejor = None
    for j in range(max(0, j0 - 15), min(len(matriz), j0 + 16)):
        for i in range(max(0, i0 - 15), min(len(matriz[0]), i0 + 16)):
            if matriz[j][i]:
                d = (i - i0) ** 2 + (j - j0) ** 2
                if mejor is None or d < mejor[0]:
                    mejor = (d, (i, j))
    return mejor[1]


def ruta_en_rejilla(matriz, desde, hasta):
    """Camino más corto en celdas (BFS en 8 direcciones) entre dos puntos del mundo."""
    a, b = celda_libre_cercana(matriz, *desde), celda_libre_cercana(matriz, *hasta)
    padre = {a: None}
    cola = deque([a])
    while cola:
        c = cola.popleft()
        if c == b:
            break
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                n = (c[0] + di, c[1] + dj)
                if 0 <= n[1] < len(matriz) and 0 <= n[0] < len(matriz[0]) and matriz[n[1]][n[0]] and n not in padre:
                    padre[n] = c
                    cola.append(n)
    ruta, c = [], b
    while c is not None:
        ruta.append(((c[0] + 0.5) * CELDA, (c[1] + 0.5) * CELDA))
        c = padre[c]
    return ruta[::-1]


def lugar_de(id_cosa):
    return 'puente' if id_cosa == 'puente' else id_cosa.removeprefix('bosque-').split('-')[0]


def pistas(t):
    """Tres pistas en el piso del ramal de cada lugar, con el ícono de su primera misión."""
    iconos = {m['id']: m['icono'] for m in t['misiones']}
    salida = []
    for mision in ('bosque-school', 'bosque-colors', 'bosque-numbers', 'bosque-body', 'bosque-family', 'bosque-time'):
        camino = COLOR_LUGAR[lugar_de(mision)]
        linea = CAMINOS[camino]
        if camino == 'verde':
            linea = linea[:4]
        for f in (0.3, 0.55, 0.8):
            k = min(int(f * (len(linea) - 1)), len(linea) - 2)
            a, b = linea[k], linea[k + 1]
            x, y = P(a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5)
            salida.append({'x': x, 'y': y, 'icono': iconos[mision], 'mision': mision})
    return salida


def hex_de(rgb):
    return '#%02x%02x%02x' % rgb


def main():
    d = json.load(open(ruta, encoding='utf-8'))
    t = d['territorios'][0]
    mundo = t['mundo']
    for m in t['misiones']:
        m['x'], m['y'] = P(*MISIONES[m['id']])
    puntos_mision = {m['id']: (m['x'], m['y']) for m in t['misiones']}
    habitantes = {h['id']: h for h in mundo['habitantes']}
    for hid, (punto, encargo) in HABITANTES.items():
        h = habitantes[hid]
        h['x'], h['y'] = P(*punto)
        if encargo and h.get('encargo'):
            h['encargo']['x'], h['encargo']['y'] = P(*encargo)
    t['puerta']['x'], t['puerta']['y'] = P(*PUERTA)

    def mision_cercana(x, y):
        return min(puntos_mision, key=lambda i: math.hypot(puntos_mision[i][0] - x, puntos_mision[i][1] - y))

    # Cada pieza se colorea con la misión más cercana (o la de su lugar); al final todo queda a color.
    objetos = []
    for n, a, q, c in OBJETOS:
        x, y = P(*q)
        objetos.append({'imagen': f'pagina/{n}.webp', 'ancho': a, 'x': x, 'y': y, 'choque': c, 'zona': EDIFICIO.get(n) or mision_cercana(x, y)})
    for mision, n, a, q in APARECEN:
        x, y = P(*q)
        objetos.append({'imagen': f'pagina/{n}.webp', 'ancho': a, 'x': x, 'y': y, 'choque': 0, 'aparece': mision})

    # Animales: dos desde el principio y uno nuevo por cada misión, que llega cuando se termina.
    criaturas = mundo['criaturas']
    orden = [m['id'] for m in t['misiones']]
    while len(criaturas) < len(orden) + 2:
        criaturas.append(dict(criaturas[len(criaturas) % 9]))
    del criaturas[len(orden) + 2:]
    for i, c in enumerate(criaturas):
        c.pop('aparece', None)
        if i < 2:
            c['x'], c['y'] = P(*[(300, 940), (420, 880)][i])
            continue
        mision = orden[i - 2]
        mx, my = puntos_mision[mision]
        c['x'], c['y'] = mx + (60 if i % 2 else -60), my - 90
        c['aparece'] = mision

    # Manchas de color: cada misión colorea alrededor de su punto; cada atajo, a lo largo de su línea.
    manchas = [{'x': x, 'y': y, 'r': RADIO_MANCHA if m != 'bosque-pozo' else 170, 'zona': m} for m, (x, y) in puntos_mision.items()]
    for a in ATAJOS.values():
        linea = lineas_mundo([a['puntos']])[0]
        for p0, p1 in zip(linea, linea[1:]):
            n = max(1, round(math.dist(p0, p1) / 110))
            for k in range(n):
                manchas.append({'x': round(p0[0] + (p1[0] - p0[0]) * k / n), 'y': round(p0[1] + (p1[1] - p0[1]) * k / n), 'r': 120, 'zona': a['abre']})
        manchas.append({'x': linea[-1][0], 'y': linea[-1][1], 'r': 120, 'zona': a['abre']})

    # Caminos con su color, para que el juego diga "sigue el camino amarillo" según la ruta.
    tramos = [{'nombre': COLORES[k][0], 'color': hex_de(COLORES[k][1]), 'puntos': [list(P(*q)) for q in v]} for k, v in CAMINOS.items()]
    tramos += [{'nombre': COLORES[k][0], 'color': hex_de(COLORES[k][1]), 'puntos': [list(P(*q)) for q in a['puntos']], 'zona': a['abre']} for k, a in ATAJOS.items()]
    atajos = [{'zona': a['abre'], 'bloqueos': bloqueos_de(a['puntos'])} for a in ATAJOS.values()]

    # Flecha de cada letrero: hacia dónde sale la ruta más corta (sin atajos) a ese lugar.
    matriz_base = libres(False)
    destinos = dict(puntos_mision, puente=P(*PUERTA))
    letreros = []
    for l in LETREROS:
        x, y = P(*l['en'])
        lleva = []
        for id_cosa in l['lleva']:
            r = ruta_en_rejilla(matriz_base, (x, y), destinos[id_cosa])
            q = r[min(len(r) - 1, 12)]
            giro = round(math.degrees(math.atan2(q[1] - r[0][1], q[0] - r[0][0])))
            nombre, rgb = COLORES[COLOR_LUGAR[lugar_de(id_cosa)]]
            lleva.append({'mision': id_cosa, 'color': hex_de(rgb), 'nombre': nombre, 'giro': giro})
        letreros.append({'x': x, 'y': y, 'lleva': lleva})

    mundo.update({
        'mapa': 'fondos/pagina-1.webp',
        'mapaLapiz': 'fondos/pagina-1-lapiz.webp',
        'ancho': MUNDO_ANCHO, 'alto': MUNDO_ALTO,
        'inicio': dict(zip('xy', P(*INICIO))),
        'arboles': [], 'tiposArbol': [], 'frente': [], 'agua': [], 'luciernagas': [],
        'objetos': objetos,
        'criaturas': criaturas,
        'luces': [{'x': MUNDO_ANCHO // 2, 'y': MUNDO_ALTO // 2, 'radio': MUNDO_ANCHO + MUNDO_ALTO}],
        'colorPenumbra': 'rgb(0 0 0 / 0)',
        'celda': CELDA,
        'caminable': rejilla(libres(True)),
        'atajos': atajos,
        'manchas': manchas,
        'tramos': tramos,
        'huellas': pistas(t),
        'letreros': letreros,
    })
    mundo.pop('ambiente', None)
    json.dump(d, open(ruta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(ruta, 'a').write('\n')
    print(f'Mundo {MUNDO_ANCHO} x {MUNDO_ALTO}, {len(t["misiones"])} misiones, {len(letreros)} letreros, {len(manchas)} manchas')
    for l in letreros:
        print(' letrero', l['x'], l['y'], [(e['mision'], e['nombre'], e['giro']) for e in l['lleva']])
    print(' atajos', atajos)


if __name__ == '__main__':
    main()
