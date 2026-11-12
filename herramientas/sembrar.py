"""Siembra los árboles sobre el suelo evitando claros, caminos y agua, y completa el mundo en cartilla.json."""
import json, random, sys, math
from PIL import Image

suelo, ruta = sys.argv[1], sys.argv[2]
random.seed(7)
N = 450
im = Image.open(suelo).convert('RGB').resize((N, N))
px = im.load()
E = 1800 / N

def clase(x, y):
    i, j = int(x / E), int(y / E)
    if not (0 <= i < N and 0 <= j < N):
        return 'bosque'
    r, g, b = px[i, j]
    if b > 140 and b > r + 40 and b > g:
        return 'agua'
    if r > 165 and g > 125 and r > b + 55 and r >= g - 10:
        return 'camino'
    if g > 150 and r > 115 and b < 110:
        return 'claro'
    return 'bosque'

def cuenta(x, y, radio):
    c = {'agua': 0, 'camino': 0, 'claro': 0, 'bosque': 0}
    n = 0
    for dx in range(-radio, radio + 1, 12):
        for dy in range(-radio, radio + 1, 12):
            if dx * dx + dy * dy <= radio * radio:
                c[clase(x + dx, y + dy)] += 1
                n += 1
    return {k: v / n for k, v in c.items()}

c = json.load(open(ruta))
t = c['territorios'][0]
m = t['mundo']
tipos = [(f'mundo/arbol-{i}.webp',) + Image.open(f'public/cartillas/ingles-3/mundo/arbol-{i}.webp').size for i in range(1, 10)]
m['tiposArbol'] = [{'imagen': a, 'ancho': w, 'alto': h} for a, w, h in tipos]

cosas = [(x['x'], x['y']) for x in t['misiones'] + m['habitantes'] + [t['puerta'], m['inicio']]]
cosas += [(o['x'], o['y']) for o in m.get('objetos', [])]
cosas += [(h['encargo']['x'], h['encargo']['y']) for h in m['habitantes'] if 'encargo' in h]
for h in m['habitantes']:
    print(h['id'], clase(h['x'], h['y']), ('encargo en ' + clase(h['encargo']['x'], h['encargo']['y'])) if 'encargo' in h else '')
arboles = []
for _ in range(9000):
    x, y = random.uniform(-20, 1820), random.uniform(90, 1900)
    if any(math.hypot(x - a['x'], (y - a['y']) * 1.25) < 118 for a in arboles):
        continue
    if any(math.hypot(x - cx, (y - 70) - cy) < 150 for cx, cy in cosas):
        continue
    tronco = cuenta(x, y - 10, 34)
    copa = cuenta(x, y - 80, 64)
    if tronco['agua'] + tronco['camino'] + tronco['claro'] > 0.02:
        continue
    if copa['claro'] > 0.04 or copa['camino'] > 0.12 or copa['agua'] > 0.3:
        continue
    arboles.append({'x': round(x), 'y': round(y), 'tipo': random.randrange(len(tipos)), 'escala': round(random.uniform(0.6, 0.9), 2)})
arboles.sort(key=lambda a: a['y'])
m['arboles'] = arboles
m['luces'] = [{'x': 882, 'y': 882, 'radio': 430}]
m['radioLuzMision'] = 380
m['ambiente'] = 'bosque-noche'
A = lambda i: f'mundo/animal-{i}.webp'
m['criaturas'] = [
    {'imagen': A(1), 'ancho': 46, 'x': 700, 'y': 760, 'radio': 130, 'movimiento': 'revolotea', 'rapidez': 1.0},
    {'imagen': A(2), 'ancho': 46, 'x': 1060, 'y': 980, 'radio': 150, 'movimiento': 'revolotea', 'rapidez': 0.8},
    {'imagen': A(1), 'ancho': 42, 'x': 1377, 'y': 1440, 'radio': 120, 'movimiento': 'revolotea', 'rapidez': 0.9},
    {'imagen': A(2), 'ancho': 42, 'x': 396, 'y': 330, 'radio': 120, 'movimiento': 'revolotea', 'rapidez': 1.1},
    {'imagen': A(3), 'ancho': 44, 'x': 990, 'y': 690, 'radio': 90, 'movimiento': 'zumba', 'rapidez': 1.6},
    {'imagen': A(3), 'ancho': 40, 'x': 330, 'y': 1380, 'radio': 100, 'movimiento': 'zumba', 'rapidez': 1.4},
    {'imagen': A(6), 'ancho': 58, 'x': 900, 'y': 520, 'radio': 520, 'movimiento': 'planea', 'rapidez': 0.35},
    {'imagen': A(4), 'ancho': 84, 'x': 1420, 'y': 1120, 'radio': 300, 'movimiento': 'planea', 'rapidez': 0.22},
    {'imagen': A(5), 'ancho': 50, 'x': 640, 'y': 400, 'radio': 0, 'movimiento': 'salta', 'rapidez': 1},
    {'imagen': A(5), 'ancho': 50, 'x': 1150, 'y': 1440, 'radio': 0, 'movimiento': 'salta', 'rapidez': 1},
]
palabras_animal = {1: ('butterfly', 'mariposa'), 2: ('butterfly', 'mariposa'), 3: ('bee', 'abeja'), 4: ('owl', 'búho'), 5: ('frog', 'rana'), 6: ('bird', 'pájaro')}
for cr in m['criaturas']:
    n = int(cr['imagen'].split('-')[-1].split('.')[0])
    cr['palabra'] = {'en': palabras_animal[n][0], 'es': palabras_animal[n][1], 'icono': cr['imagen']}

# Agua: cuadrícula donde no se puede caminar (el puente sí se cruza).
CELDA = 20
filas = []
for j in range(1800 // CELDA):
    fila = ''
    for i in range(1800 // CELDA):
        x, y = i * CELDA + CELDA / 2, j * CELDA + CELDA / 2
        n = sum(clase(x + dx, y + dy) == 'agua' for dx in (-6, 6) for dy in (-6, 6))
        puente = 1480 < x < 1740 and 800 < y < 925
        fila += '1' if n >= 3 and not puente else '0'
    filas.append(fila)
m['celda'] = CELDA
m['agua'] = filas
print('\n'.join(f[::2] for f in filas[::2]))

# Copas en primer plano: pasan más rápido que el suelo y dan profundidad. Solo en bosque cerrado.
frente = []
for _ in range(4000):
    x, y = random.uniform(100, 1700), random.uniform(250, 1750)
    if any(math.hypot(x - fx, y - fy) < 430 for fx, fy, *_ in frente):
        continue
    if any(math.hypot(x - cx, y - cy) < 330 for cx, cy in cosas):
        continue
    zona = cuenta(x, y - 60, 150)
    if zona['claro'] + zona['camino'] > 0.03:
        continue
    frente.append((x, y, random.randrange(len(tipos))))
m['frente'] = [{'x': round(x), 'y': round(y), 'tipo': tp} for x, y, tp in frente]
print(len(frente), 'copas al frente')

json.dump(c, open(ruta, 'w'), ensure_ascii=False, indent=2)
open(ruta, 'a').write('\n')
print(len(arboles), 'árboles')
