"""Arma el Bosque de los Sonidos sobre la imagen del suelo y lo escribe en cartilla.json.

Lee los colores del suelo para encontrar los claros, los caminos y el agua, y con eso:
reparte las misiones (tres por camino, la hora y el pozo), los habitantes y sus casas sin que se encimen,
pone pistas en el piso de cada camino, siembra los árboles y marca dónde no se camina.

Uso: python3 -I herramientas/construir_bosque.py suelo.png public/cartillas/ingles-3/cartilla.json
Si cambia la imagen del suelo hay que volver a ejecutarlo.
"""
import heapq
import json
import math
import random
import sys
from collections import deque

from PIL import Image, ImageFilter

suelo, ruta = sys.argv[1], sys.argv[2]
random.seed(11)

MUNDO = 2800
N = 700  # cuadrícula de análisis
E = MUNDO / N
# El suelo pintado tiene detalle fino (flores, piedras, hongos, brillos del agua). La mediana
# de 5 × 5 celdas (20 px del mapa) lo borra para que la clasificación vea las zonas grandes:
# plaza, claros, caminos y agua. Con el suelo de noviembre de 2026 ya es necesaria.
im = Image.open(suelo).convert('RGB').resize((N, N)).filter(ImageFilter.MedianFilter(5))
px = im.load()


def clase_celda(i, j):
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


CLASE = [[clase_celda(i, j) for i in range(N)] for j in range(N)]


def clase(x, y):
    i, j = int(x / E), int(y / E)
    return CLASE[j][i] if 0 <= i < N and 0 <= j < N else 'bosque'


def cuenta(x, y, radio):
    radio = int(radio)
    c = {'agua': 0, 'camino': 0, 'claro': 0, 'bosque': 0}
    n = 0
    for dx in range(-radio, radio + 1, 12):
        for dy in range(-radio, radio + 1, 12):
            if dx * dx + dy * dy <= radio * radio:
                c[clase(x + dx, y + dy)] += 1
                n += 1
    return {k: v / n for k, v in c.items()}


# ---------- Claros ----------
visto = [[False] * N for _ in range(N)]
claros = []
for j in range(N):
    for i in range(N):
        if visto[j][i] or CLASE[j][i] != 'claro':
            continue
        cola, celdas = deque([(i, j)]), []
        visto[j][i] = True
        while cola:
            a, b = cola.popleft()
            celdas.append((a, b))
            for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                u, v = a + da, b + db
                if 0 <= u < N and 0 <= v < N and not visto[v][u] and CLASE[v][u] == 'claro':
                    visto[v][u] = True
                    cola.append((u, v))
        if len(celdas) > 600:
            cx = sum(c[0] for c in celdas) / len(celdas) * E
            cy = sum(c[1] for c in celdas) / len(celdas) * E
            claros.append({'x': cx, 'y': cy, 'r': math.sqrt(len(celdas) / math.pi) * E})
claros.sort(key=lambda c: -c['r'])
centro, resto = claros[0], claros[1:]
assert len(resto) == 10, f'se esperaban 10 claros pequeños y hay {len(resto)}'

# Cinco caminos: en cada uno, el claro cercano (A) y el lejano (B).
for c in resto:
    c['ang'] = math.degrees(math.atan2(c['y'] - centro['y'], c['x'] - centro['x']))
    c['dist'] = math.hypot(c['x'] - centro['x'], c['y'] - centro['y'])
cercanos = sorted(resto, key=lambda c: c['dist'])[:5]
caminos = []
for a in cercanos:
    lejanos = [c for c in resto if c not in cercanos]
    b = min(lejanos, key=lambda c: abs((c['ang'] - a['ang'] + 180) % 360 - 180))
    caminos.append((a, b))


def tema_de(ang):
    # Ángulos de pantalla: 0 a la derecha, -90 arriba, 180 a la izquierda.
    if -180 <= ang < -100:
        return 'school'
    if -100 <= ang < 0:
        return 'numbers'
    if 0 <= ang < 100:
        return 'family'
    if 100 <= ang < 160:
        return 'body'
    return 'colors'


CAMINO = {tema_de(a['ang']): (a, b) for a, b in caminos}
assert len(CAMINO) == 5, CAMINO.keys()


def ruta_entre(p, q):
    """Camino más barato entre dos puntos: pisar camino o claro cuesta poco, bosque mucho, agua no se pisa."""
    ini, fin = (int(p['x'] / E), int(p['y'] / E)), (int(q['x'] / E), int(q['y'] / E))
    costo = {'camino': 1, 'claro': 1, 'bosque': 14}
    mejor, previo = {ini: 0}, {ini: None}
    cola = [(0, ini)]
    while cola:
        d, actual = heapq.heappop(cola)
        if actual == fin:
            break
        if d > mejor[actual]:
            continue
        for da in (-1, 0, 1):
            for db in (-1, 0, 1):
                sig = (actual[0] + da, actual[1] + db)
                if (da == 0 and db == 0) or not (0 <= sig[0] < N and 0 <= sig[1] < N):
                    continue
                tipo = CLASE[sig[1]][sig[0]]
                if tipo == 'agua':
                    continue
                nd = d + costo[tipo] * (1.41 if da and db else 1)
                if nd < mejor.get(sig, 1e18):
                    mejor[sig], previo[sig] = nd, actual
                    heapq.heappush(cola, (nd, sig))
    assert fin in previo, 'no hay camino entre los claros'
    puntos, actual = [], fin
    while actual:
        puntos.append((actual[0] * E + E / 2, actual[1] * E + E / 2))
        actual = previo[actual]
    return puntos[::-1]


def al_centro_del_camino(x, y):
    """Mueve un punto al centro del ancho del camino."""
    mejor, mayor = (x, y), -1
    for dx in range(-40, 41, 8):
        for dy in range(-40, 41, 8):
            n = cuenta(x + dx, y + dy, 36)['camino']
            if n > mayor:
                mejor, mayor = (x + dx, y + dy), n
    return mejor


def puntos_del_camino(p, q, separacion):
    """Puntos repartidos sobre el tramo de camino entre dos claros, sin tocar los claros."""
    tramo = [pt for pt in ruta_entre(p, q) if math.hypot(pt[0] - p['x'], pt[1] - p['y']) > p['r'] + 45 and math.hypot(pt[0] - q['x'], pt[1] - q['y']) > q['r'] + 45]
    salida, recorrido, previo = [], separacion / 2, None
    for pt in tramo:
        if previo:
            recorrido += math.hypot(pt[0] - previo[0], pt[1] - previo[1])
        previo = pt
        if recorrido >= separacion:
            salida.append(al_centro_del_camino(*pt))
            recorrido = 0
    return salida


# ---------- Contenido ----------
c = json.load(open(ruta))
t = c['territorios'][0]
m = t['mundo']
# Los iconos propios (Canva) son WebP; los de Noto Emoji, SVG.
I = lambda n: f'iconos/{n}' if '.' in n else f'iconos/{n}.svg'
# Guía de pronunciación escrita como se lee en español (pedagogía, ronda 1, sección 6). El juego
# de voz la muestra en lugar de la palabra escrita, para que escribirla siga siendo un reto.
# Reglas: una sílaba sin tilde; dos o más con guion y tilde en la fuerte; sin vocales dobles;
# la z marca el sonido "th" (lengua entre los dientes) y la j, la h inglesa.
PRONUNCIA = {
    'pencil': 'pén-sil',
    'eraser': 'i-réi-ser',
    'notebook': 'nóut-buk',
    'ruler': 'rú-ler',
    'scissors': 'sí-sers',
    'backpack': 'bák-pak',
    'book': 'buk',
    'pen': 'pen',
    'crayon': 'kréi-on',
    'chair': 'cher',
    'red': 'red',
    'blue': 'blu',
    'green': 'grin',
    'yellow': 'yé-lou',
    'orange': 'ó-rinch',
    'purple': 'pér-pel',
    'pink': 'pink',
    'brown': 'braun',
    'black': 'blak',
    'white': 'uait',
    'one': 'uan',
    'two': 'tu',
    'three': 'zri',
    'four': 'for',
    'five': 'faiv',
    'six': 'siks',
    'seven': 'sé-ven',
    'eight': 'eit',
    'nine': 'nain',
    'ten': 'ten',
    'head': 'jed',
    'eyes': 'ais',
    'ears': 'irs',
    'nose': 'nous',
    'mouth': 'mauz',
    'hands': 'jands',
    'arms': 'arms',
    'legs': 'legs',
    'feet': 'fit',
    'hello': 'je-lóu',
    'good morning': 'gud mór-ning',
    'good night': 'gud nait',
    'thank you': 'zénk-iu',
    'mother': 'mó-der',
    'father': 'fá-der',
    'sister': 'sís-ter',
    'brother': 'bró-der',
    'grandmother': 'gránd-mo-der',
    'grandfather': 'gránd-fa-der',
    'baby': 'béi-bi',
    "one o'clock": 'uan o-klók',
    "three o'clock": 'zri o-klók',
    "six o'clock": 'siks o-klók',
    "nine o'clock": 'nain o-klók',
    "ten o'clock": 'ten o-klók',
    "twelve o'clock": 'tuelv o-klók',
    # Animales del álbum: no pasan por W, se toman de aquí en criatura().
    'bee': 'bi',
    'bird': 'berd',
    'butterfly': 'bá-ter-flai',
    'frog': 'frog',
    'owl': 'aul',
}
# Lo que el reconocedor de voz puede escribir cuando el niño dijo bien la palabra: solo
# cifras y homófonos reales. Las horas aceptan "3:00".
ACEPTAR = {
    'one': ['1', 'won'],
    'two': ['2', 'to', 'too'],
    'four': ['4', 'for'],
    'eight': ['8', 'ate'],
    'feet': ['feat'],
    'thank you': ['thanks'],
    "one o'clock": ['1:00'],
    "three o'clock": ['3:00'],
    "six o'clock": ['6:00'],
    "nine o'clock": ['9:00'],
    "ten o'clock": ['10:00'],
    "twelve o'clock": ['12:00'],
}
# Frase completa que se dice al presentar la palabra: la pregunta de la hora tiene respuesta.
FRASE = {
    "one o'clock": "It's one o'clock.",
    "three o'clock": "It's three o'clock.",
    "six o'clock": "It's six o'clock.",
    "nine o'clock": "It's nine o'clock.",
    "ten o'clock": "It's ten o'clock.",
    "twelve o'clock": "It's twelve o'clock.",
}


def W(en, es, icono):
    p = {'en': en, 'es': es, 'icono': I(icono)}
    for campo, tabla in (('pronuncia', PRONUNCIA), ('aceptar', ACEPTAR), ('frase', FRASE)):
        if en in tabla:
            p[campo] = tabla[en]
    return p


L = lambda quien, es, en, **mas: {'quien': quien, 'es': es, 'en': en, **mas}

# Por camino: grupo A (Escucha y toca), grupo B (Listen & Catch) y las cinco que se dicen
# en Di y brilla, tomadas de A y B y siempre con la palabra del vecino.
PALABRAS = {
    'school': (
        [W('pencil', 'lápiz', '270f'), W('eraser', 'borrador', 'eraser.webp'), W('notebook', 'cuaderno', '1f4d3'), W('ruler', 'regla', '1f4cf'), W('scissors', 'tijeras', '2702')],
        [W('backpack', 'mochila', '1f392'), W('book', 'libro', '1f4d8'), W('pen', 'lapicero', 'pen.webp'), W('crayon', 'crayola', '1f58d'), W('chair', 'silla', '1fa91')],
    ),
    'colors': (
        [W('red', 'rojo', '1f534'), W('blue', 'azul', '1f535'), W('green', 'verde', '1f7e2'), W('yellow', 'amarillo', '1f7e1'), W('orange', 'naranja', '1f7e0')],
        [W('purple', 'morado', '1f7e3'), W('pink', 'rosado', 'color-pink'), W('brown', 'café', 'color-brown'), W('black', 'negro', 'color-black-borde'), W('white', 'blanco', 'color-white-borde')],
    ),
    'numbers': (
        [W('one', 'uno', '0031_20e3'), W('two', 'dos', '0032_20e3'), W('three', 'tres', '0033_20e3'), W('four', 'cuatro', '0034_20e3'), W('five', 'cinco', '0035_20e3')],
        [W('six', 'seis', '0036_20e3'), W('seven', 'siete', '0037_20e3'), W('eight', 'ocho', '0038_20e3'), W('nine', 'nueve', '0039_20e3'), W('ten', 'diez', '1f51f')],
    ),
    'body': (
        [W('eyes', 'ojos', '1f440'), W('ears', 'orejas', '1f442'), W('nose', 'nariz', '1f443'), W('mouth', 'boca', '1f444')],
        [W('head', 'cabeza', 'head.webp'), W('arms', 'brazos', 'arms.webp'), W('hands', 'manos', '1f64c'), W('legs', 'piernas', 'legs.webp'), W('feet', 'pies', '1f9b6')],
    ),
    'family': (
        [W('hello', 'hola', '1f44b'), W('good morning', 'buenos días', '1f305'), W('good night', 'buenas noches', '1f319'), W('thank you', 'gracias', '1f64f')],
        [W('mother', 'mamá', '1f469'), W('father', 'papá', '1f468'), W('sister', 'hermana', '1f467'), W('brother', 'hermano', '1f466'), W('grandmother', 'abuela', '1f475'), W('grandfather', 'abuelo', '1f474'), W('baby', 'bebé', '1f476')],
    ),
}
DECIR = {
    'school': ['pencil', 'eraser', 'notebook', 'book', 'chair'],
    'colors': ['red', 'blue', 'green', 'pink', 'black'],
    'numbers': ['one', 'three', 'five', 'eight', 'ten'],
    'body': ['nose', 'eyes', 'mouth', 'hands', 'legs'],
    'family': ['hello', 'thank you', 'mother', 'father', 'grandmother'],
}
# Títulos e iconos de las tres misiones de cada camino. La tercera lleva la palabra del vecino.
TITULOS = {
    'school': ('School objects', 'More school objects', 'Say the school objects', '1f392', '1f4d8', 'eraser.webp'),
    'colors': ('Colors', 'More colors', 'Say the colors', '1f7e3', 'color-pink', '1f534'),
    'numbers': ('Numbers 1 to 5', 'Numbers 6 to 10', 'Count out loud', '0033_20e3', '0038_20e3', '0035_20e3'),
    'body': ('My face', 'My body', 'Say your body', '1f440', '1f64c', '1f443'),
    'family': ('Hello!', 'My family', 'Say hello to the family', '1f44b', '1f469', '1f44b'),
}
# En inglés se usan contracciones (Let's, It's, I'm, That's): así las oirá el niño.
ANTES = {
    'school': (
        L('cosmo', 'Aquí se apagaron los útiles de la escuela. Escucha y toca el correcto.', 'The school things lost their light here. Listen and tap the right one.'),
        L('cosmo', '¡Mira! Hay más cosas del salón flotando. Atrapa la que escuches.', 'Look! More classroom things are floating. Catch the one you hear.'),
        L('cosmo', 'Ahora tú le das voz a las palabras. Escucha, y cuando quieras, dila. ¡Cada intento cuenta!', "Now you give the words a voice. Listen, and when you're ready, say it. Every try counts!"),
    ),
    'colors': (
        L('cosmo', 'Los colores del bosque se volvieron grises. ¡Vamos a encenderlos!', "The colors of the forest turned gray. Let's light them up!"),
        L('cosmo', 'Cinco colores más vuelan por el aire. Escucha y atrapa el que te digo.', 'Five more colors are flying. Listen and catch the one I say.'),
        L('cosmo', '¡Tu voz enciende los colores! Escucha cada uno y dilo como te salga.', 'Your voice lights up the colors! Listen to each one and say it your way.'),
    ),
    'numbers': (
        L('cosmo', 'Los números se escondieron entre los árboles. Empecemos del uno al cinco.', "The numbers are hiding in the trees. Let's count from one to five."),
        L('cosmo', '¡Ya llegas al cinco! Ahora atrapa del seis al diez.', 'You can count to five! Now catch six to ten.'),
        L('cosmo', 'Abu quiere oírte contar. Escucha el número y dilo tú.', 'Abu wants to hear you count. Listen to the number and say it.'),
    ),
    'body': (
        L('cosmo', 'Mira tu cara: ojos, orejas, nariz y boca. Cuando oigas una, tócatela tú también.', 'Look at your face: eyes, ears, nose and mouth. When you hear one, touch it too!'),
        L('cosmo', 'Ahora el resto del cuerpo: cabeza, brazos, manos, piernas y pies. ¡Atrápalos!', 'Now the rest of the body: head, arms, hands, legs and feet. Catch them!'),
        L('cosmo', 'Púa quiere oírte nombrar el cuerpo. Escucha y dilo en voz alta.', 'Púa wants to hear you name the body. Listen and say it out loud.'),
    ),
    'family': (
        L('cosmo', 'Aquí aprendemos a saludar y a dar las gracias.', 'Here we learn to say hello and thank you.'),
        L('cosmo', 'En cada casa vive una familia distinta. Escucha y atrapa a cada persona.', 'Every home has a different family. Listen and catch each person.'),
        L('cosmo', 'Vamos a saludar a la familia del bosque. Escucha y dilo tú.', "Let's say hello to the forest family. Listen and say it."),
    ),
}
PLANTILLAS = ('escucha-toca', 'escucha-atrapa', 'di-brilla')
SUFIJO = ('', '-2', '-3')
# Listen & Catch: segundos que tarda un farolito en cruzar (al principio y al final; nunca
# más rápido que el final) y distractores por ronda (la última cifra vale para el resto).
ATRAPA = {'cruceInicio': 6, 'cruceFinal': 4.5, 'distractores': [2, 2, 3]}

# Estrellas PROVISIONALES: 3 por misión de camino (45) y 5 en la hora (3 + 2) suman los 50 del
# puente. La opción B de Manuel (el puente abre con todos los faroles y Mission Stars vuelve a
# la escala de la tesis) está pendiente; ya no se exige que la suma cuadre.
ESTRELLAS_POR_MISION = (3, 3, 3)
ESTRELLAS_HORA = (3, 2)
RELOJES = [W("one o'clock", 'la una', 'reloj-1.webp'), W("three o'clock", 'las tres', 'reloj-3.webp'), W("six o'clock", 'las seis', 'reloj-6.webp'),
           W("nine o'clock", 'las nueve', 'reloj-9.webp'), W("ten o'clock", 'las diez', 'reloj-10.webp'), W("twelve o'clock", 'las doce', 'reloj-12.webp')]
RELOJES_DECIR = ["three o'clock", "six o'clock", "twelve o'clock"]
# Memory de repaso en el pozo de la plaza: usa las palabras de las misiones ya completadas y
# despierta al completar la primera misión de cualquier camino.
TEMAS = ('school', 'colors', 'numbers', 'body', 'family')
POZO = {
    'id': 'bosque-pozo', 'titulo': 'Memory well', 'plantilla': 'memoria', 'icono': 'mundo/objeto-6.webp', 'palabras': [],
    'palabrasDe': [f'bosque-{tema}{s}' for tema in TEMAS for s in SUFIJO[:2]] + ['bosque-time'],
    'requiereAlguna': [f'bosque-{tema}' for tema in TEMAS],
    'escenaDormida': 'pozo-dormido',
    'formas': ['imagen-sonido', 'imagen-palabra'], 'parejas': 4,
    'antes': [L('lumi', 'Este es el pozo de los recuerdos. Gira dos cartas y busca las que van juntas.', 'This is the memory well. Flip two cards and find the ones that go together.')],
    'estrellas': 0,
}


def de_tema(tema, en):
    return next(p for p in PALABRAS[tema][0] + PALABRAS[tema][1] if p['en'] == en)


misiones = []
for tema in TEMAS:
    a, b = CAMINO[tema]
    for parte in range(3):
        # 1: mirar y jugar con A en el claro A. 2: jugar con B en el claro B.
        # 3: decir A y B de vuelta en el claro A, junto al vecino (el lugar se fija más abajo).
        claro = (a, b, None)[parte]
        misiones.append({
            'id': f'bosque-{tema}{SUFIJO[parte]}',
            'titulo': TITULOS[tema][parte],
            'plantilla': PLANTILLAS[parte],
            'icono': I(TITULOS[tema][3 + parte]),
            'palabras': [de_tema(tema, en) for en in DECIR[tema]] if parte == 2 else PALABRAS[tema][parte],
            'x': round(claro['x']) if claro else None,
            'y': round(claro['y'] - 10) if claro else None,
            'antes': [ANTES[tema][parte]],
            'estrellas': ESTRELLAS_POR_MISION[parte],
            **({'atrapa': ATRAPA} if parte == 1 else {}),
            **({'requiere': f'bosque-{tema}{SUFIJO[parte - 1]}'} if parte else {}),
        })
t['misiones'] = misiones
c['estelas'] = [
    {'id': 'oro', 'estrellas': 0, 'colores': ['#fff3a6', '#ffd95a']},
    {'id': 'menta', 'estrellas': 12, 'colores': ['#b6fff0', '#19c6b1']},
    {'id': 'rosa', 'estrellas': 26, 'colores': ['#ffd0e6', '#ff5fa2']},
    {'id': 'arcoiris', 'estrellas': 40, 'colores': ['#ff5f6d', '#ffc371', '#fff36b', '#6bffb0', '#6bc5ff', '#c58bff']},
]
t['idiomaPorAvance'] = ['es', 'es', 'es', 'es', 'mixto', 'mixto', 'mixto', 'mixto', 'mixto', 'en', 'en']

# ---------- Habitantes: uno por camino, en el primer claro, con su palabra perdida ----------
P = t['personajes']
VECINOS = {
    'school': ('caro', 'Caro', 5, 88, 'eraser', ['pencil', 'eraser', 'ruler']),
    'colors': ('tito', 'Tito', 1, 78, 'red', ['blue', 'red', 'yellow']),
    'numbers': ('abu', 'Abu', 3, 82, 'three', ['five', 'three', 'one']),
    'body': ('pua', 'Púa', 2, 78, 'nose', ['eyes', 'nose', 'ears']),
    'family': ('nuez', 'Nuez', 4, 82, 'hello', ['thank you', 'hello', 'good night']),
}
for clave in ('cosmo', 'pixie', 'lumi'):
    P[clave]['ancho'] = 96
P['rayo'] = {'nombre': 'Rayo', 'imagen': 'personajes/vecino-6.webp', 'ancho': 84}

E_ = t['escenas']
for clave in list(E_):
    if clave.split('-')[0] in ('tito', 'abu', 'caro', 'pua', 'nuez', 'rayo'):
        del E_[clave]

# Nada de comparar con otros niños ni de reírse del error, y nada en masculino genérico
# (dos de los tres personajes pueden ser niñas): se usa "Explorer", el título del nivel.
TEXTOS = {
    'caro': {
        'pide': [
            L('caro', 'Hooola... Soy Caro. Voy despacito, despacito... y se me cayó una palabra de la mochila.', "Hellooo... I'm Caro. I go slowly, slowly... and a word fell out of my backpack."),
            L('caro', 'Está más adelante, en este camino. Escucha cuál es y tráemela, ¿sí?', "It's up ahead, on this path. Listen to the word and bring it to me, okay?"),
        ],
        'otra': [L('caro', 'Mmm... esa no es. ¡No pasa nada! Yo también me equivoco. Escucha otra vez.', "Hmm... not that one. That's okay! I make mistakes too. Listen again.")],
        'gracias': [
            L('caro', '¡Esa es! ¡Eraser! Ya puedo borrar y volver a intentar.', "That's it! Eraser! Now I can erase and try again."),
            L('caro', 'La guardé en tu álbum. ¡Gracias por tomarte tu tiempo conmigo!', 'I put it in your album. Thank you for taking your time with me!'),
        ],
        'listo': [L('caro', 'Eraser, eraser... la repito despacito para que no se me vuelva a caer.', 'Eraser, eraser... I say it slowly so it never falls again.')],
    },
    'tito': {
        'pide': [
            L('tito', '¡Hola! Soy Tito. Mi sombrero tenía un color muy bonito... ¡y olvidé cómo se llama!', "Hello! I'm Tito. My hat had a beautiful color... and I forgot its name!"),
            L('tito', 'La palabra rodó por este camino. Escúchala y tráemela, por favor.', 'The word rolled down this path. Listen to it and bring it to me, please.'),
        ],
        'otra': [L('tito', '¡Uy! Ese no es el color de mi sombrero. ¡No pasa nada! Escucha otra vez y prueba otro.', "Oops! That's not the color of my hat. That's okay! Listen again and try another one.")],
        'gracias': [
            L('tito', '¡Red! ¡Mi sombrero es red! ¡Mira cómo brilla!', 'Red! My hat is red! Look how it shines!'),
            L('tito', 'Ya está en tu álbum. ¡Escuchaste con mucha atención!', "It's in your album now. You listened very carefully!"),
        ],
        'listo': [L('tito', '¡Red como mi sombrero! Cuando lo veas, acuérdate de mí.', 'Red like my hat! When you see it, think of me.')],
    },
    'abu': {
        'pide': [
            L('abu', 'Buenas, Explorer. Soy Abu. Llevo cien años contando las piedras del camino...', "Good day, Explorer. I'm Abu. I've counted the stones on this path for a hundred years..."),
            L('abu', '...y hoy se me perdió un número. Está más adelante. Escucha bien cuál es.', "...and today I lost a number. It's up ahead. Listen carefully."),
        ],
        'otra': [L('abu', 'Mmm, ese es otro número. Los sabios también se equivocan. Escucha de nuevo, con calma.', "Hmm, that's a different number. Wise ones make mistakes too. Listen again, calmly.")],
        'gracias': [
            L('abu', '¡Three! One, two, three... ¡ya puedo seguir contando!', 'Three! One, two, three... now I can keep counting!'),
            L('abu', 'Guárdalo en tu álbum. Un número nunca sobra.', 'Keep it in your album. A number is always useful.'),
        ],
        'listo': [L('abu', 'One, two, three... ¿cuentas conmigo?', 'One, two, three... will you count with me?')],
    },
    'pua': {
        'pide': [
            L('pua', '¡Frutas, frutas frescas! Soy Púa... pero hoy no huelo nada. ¡Nada de nada!', "Fruit, fresh fruit! I'm Púa... but today I can't smell a thing. Nothing at all!"),
            L('pua', 'Se me perdió la palabra de lo que uso para oler. ¿Me la buscas en este camino?', 'I lost the word for what I smell with. Can you find it on this path?'),
        ],
        'otra': [L('pua', '¡Uy, con eso no huelo! No importa: escucha otra vez y prueba con otra.', "Oops, I can't smell with that! Never mind. Listen again and try another one.")],
        'gracias': [
            L('pua', '¡Nose! ¡Esa es! Mmm... ¡qué rico huelen mis frutas!', "Nose! That's it! Mmm... my fruit smells so good!"),
            L('pua', 'Toma, va para tu álbum. ¡Y gracias por ayudarme!', 'Here, it goes in your album. And thank you for helping me!'),
        ],
        'listo': [L('pua', 'Con mi nose huelo las frutas. ¿Y tú, qué hueles?', 'With my nose I smell the fruit. And you, what can you smell?')],
    },
    'nuez': {
        'pide': [
            L('nuez', '¡Pan calientito! Soy Nuez, la panadera. Quiero saludar a todos los que pasan...', "Warm bread! I'm Nuez, the baker. I want to greet everyone who walks by..."),
            L('nuez', '...pero olvidé cómo se saluda. La palabra se fue por este camino. ¿Me la traes?', '...but I forgot how to say it. The word went down this path. Can you bring it?'),
        ],
        'otra': [L('nuez', '¡Buen intento! Esa palabra es bonita, pero no es para saludar. Escucha otra vez. ¡Tú puedes!', "Good try! That's a nice word, but it's not for saying hello. Listen again. You can do it!")],
        'gracias': [
            L('nuez', '¡Hello! ¡Hello, hello! ¡Ya puedo saludar a todo el bosque!', 'Hello! Hello, hello! Now I can greet the whole forest!'),
            L('nuez', 'Queda en tu álbum. Y cuando vuelvan todas las palabras, haré una fiesta con pan.', "It's in your album. And when all the words come back, I'll bake bread for a party!"),
        ],
        'listo': [L('nuez', '¡Hello, Explorer! ¿Ves? Ya no se me olvida.', 'Hello, Explorer! See? I never forget it now.')],
    },
}

# Escenas fijas que arma este guion (las demás, como 'intro' o 'lumi', viven solo en el JSON).
# 'rayo' y 'puente-cerrado' siguen hablando de 50 estrellas hasta que se aplique la opción B.
ESCENAS = {
    'ayuda': {'lineas': [
        L('cosmo', 'Toca la pantalla y caminas hasta tu dedo. ¡Puedes ir a donde quieras!', 'Touch the screen and you walk to your finger. You can go anywhere!'),
        L('pixie', 'Sigue los dibujos del piso: cada camino te cuenta a dónde lleva.', 'Follow the pictures on the ground: each path tells you where it goes.'),
        L('pixie', 'Los vecinos del bosque perdieron sus palabras. ¡Ayúdalos a encontrarlas!', 'The forest neighbors lost their words. Help them find them!'),
    ], 'luego': 'elegir'},
    'cosmo': {'lineas': [L('cosmo', '¡Qué bueno verte! Hay faroles por encender y vecinos que necesitan ayuda.', 'Good to see you! There are lanterns to light and neighbors who need help.')], 'luego': 'elegir'},
    'dormida': {'lineas': [L('cosmo', 'Este farol todavía duerme. Despierta cuando enciendas el que está antes en este camino.', 'This lantern is still asleep. It wakes up when you light the one before it on this path.')]},
    'pozo-dormido': {'lineas': [L('lumi', 'Enciende cualquier farol de un camino y el pozo despertará.', 'Light any lantern on a path and the well will wake up.')]},
    'rayo': {'lineas': [
        L('rayo', '¡Correo, correo! Soy Rayo. Llevo cartas al Valle de las Palabras...', "Mail, mail! I'm Rayo. I carry letters to the Valley of Words..."),
        L('rayo', '...pero siempre llego tarde: el reloj del bosque se apagó y el puente también.', "...but I'm always late: the forest clock went dark, and so did the bridge."),
        L('rayo', 'Completa todas las misiones. Con las 50 estrellas, el puente se enciende.', 'Complete all the missions. With all 50 stars, the bridge lights up.'),
    ]},
    'puente-cerrado': {'lineas': [
        L('nova', 'Soy Nova. Este puente lleva al Valle de las Palabras.', "I'm Nova. This bridge goes to the Valley of Words."),
        L('nova', 'Cada misión que completas te da estrellas. Cuando tengas 50, el puente se encenderá.', 'Every mission you complete gives you stars. When you have 50, the bridge will light up.'),
    ]},
}
E_.update(ESCENAS)
# Frases que dicen los juegos para ayudar (diseño, ronda 1, sección 7). Las revisa el pedagogo.
AYUDAS = {
    'memoria-tutorial': {'es': '¡Iguales! Ahora tú.', 'en': 'They match! Your turn.'},
    'memoria-pista1': {'es': 'Escucha bien: cada dibujo tiene su palabra.', 'en': 'Listen: every picture has its word.'},
    'memoria-pista2': {'es': 'Mira, por aquí.', 'en': 'Look, over here.'},
    'atrapa-inicio': {'es': 'Atrapa la luz que te digo.', 'en': 'Catch the light I say.'},
}
c['ayudas'] = AYUDAS


def palabra(tema, en):
    return next(p for p in PALABRAS[tema][0] if p['en'] == en)


ocupado = []  # (x, y, radio) de todo lo que ya tiene lugar


def ocupar(x, y, r):
    ocupado.append((x, y, r))


def hay_sitio(x, y, r):
    return all(math.hypot(x - ox, y - oy) > r + orr for ox, oy, orr in ocupado)


def mejor_borde(claro, distancia, radio, prohibido=('camino', 'agua', 'claro')):
    """Lugar junto a un claro, fuera de él, donde no hay camino ni agua ni otra cosa."""
    mejor, menor = None, 9
    for paso in range(24):
        ang = math.radians(paso * 15 - 90)
        x, y = claro['x'] + math.cos(ang) * distancia, claro['y'] + math.sin(ang) * distancia * 0.85
        if not (120 < x < MUNDO - 120 and 200 < y < MUNDO - 60) or not hay_sitio(x, y, radio):
            continue
        zona = cuenta(x, y - radio * 0.5, radio + 20)
        malo = sum(zona[k] for k in prohibido) + (0.15 if math.sin(ang) > 0.3 else 0)  # mejor arriba: no tapa el claro
        if malo < menor:
            mejor, menor = (x, y), malo
    assert mejor, 'no hay sitio junto al claro'
    return round(mejor[0]), round(mejor[1])


O = lambda n, ancho, x, y, choque=0, luz=False: {'imagen': f'mundo/objeto-{n}.webp', 'ancho': ancho, 'x': round(x), 'y': round(y), 'choque': choque, **({'luz': True} if luz else {})}
objetos, habitantes, huellas = [], [], []
CX, CY = centro['x'], centro['y']

# Plaza central.
m['inicio'] = {'x': round(CX), 'y': round(CY + 120)}
habitantes.append({'id': 'pixie', 'personaje': 'pixie', 'x': round(CX - 80), 'y': round(CY + 10), 'escena': 'intro'})
habitantes.append({'id': 'cosmo', 'personaje': 'cosmo', 'x': round(CX + 85), 'y': round(CY + 25), 'escena': 'cosmo'})
objetos.append(O(6, 105, CX, CY - 105, 38))  # pozo
objetos.append(O(8, 120, CX + 150, CY + 175, 26))  # banca
for hx, hy in ((CX - 80, CY + 10), (CX + 85, CY + 25), (CX, CY - 105), (CX + 150, CY + 175), (CX, CY + 120)):
    ocupar(hx, hy, 70)
for tm in misiones:
    if tm['x'] is not None:
        ocupar(tm['x'], tm['y'], 95)


def sitio_cerca(x0, y0, evitar, claro=None):
    """El punto más cercano a (x0, y0) que no se encima con nada de `evitar` [(x, y, distancia)]
    ni pisa agua; si se da un claro, mejor dentro de él. Lo usan la tercera misión de cada
    camino (junto al vecino) y el Memory del pozo."""
    mejor, menor = None, 1e9
    for paso in range(24):
        ang = math.radians(paso * 15)
        for dist in range(90, 171, 10):
            x, y = x0 + math.cos(ang) * dist, y0 + math.sin(ang) * dist
            if not (120 < x < MUNDO - 120 and 200 < y < MUNDO - 60) or clase(x, y) == 'agua':
                continue
            if any(math.hypot(x - ex, y - ey) < d for ex, ey, d in evitar):
                continue
            costo = dist + (2 * max(0, math.hypot(x - claro['x'], y - claro['y']) - claro['r']) if claro else 0)
            if costo < menor:
                mejor, menor = (x, y), costo
    assert mejor, 'no hay sitio cerca'
    return round(mejor[0]), round(mejor[1])


CASA = {'tito': (1, 190, 62), 'nuez': (2, 190, 62), 'abu': (3, 170, 56), 'pua': (9, 150, 50), 'caro': (5, 78, 12)}
for tema in TEMAS:
    a, b = CAMINO[tema]
    clave, nombre, n, ancho, pide, opciones = VECINOS[tema]
    P[clave] = {'nombre': nombre, 'imagen': f'personajes/vecino-{n}.webp', 'ancho': ancho}
    for parte, lineas in TEXTOS[clave].items():
        E_[f'{clave}-{parte}'] = {'lineas': lineas}
    # El habitante, a un lado del farol de la misión, dentro del claro.
    lado = -1 if a['x'] > CX else 1
    hx, hy = a['x'] + lado * a['r'] * 0.86, a['y'] + a['r'] * 0.42
    ocupar(hx, hy, 60)
    # Su casa (o su carreta, o su señal), al borde del claro.
    cn, cancho, cchoque = CASA[clave]
    casa = mejor_borde(a, a['r'] + cancho * 0.42, cancho * 0.5)
    objetos.append(O(cn, cancho, casa[0], casa[1], cchoque))
    ocupar(casa[0], casa[1] - cancho * 0.3, cancho * 0.55)
    # La palabra perdida y sus dos compañeras, a mitad del tramo hacia el segundo claro.
    tramo = puntos_del_camino(a, b, 60)
    ex, ey = tramo[len(tramo) // 2]
    ocupar(ex, ey, 150)
    habitantes.append({
        'id': clave, 'personaje': clave, 'x': round(hx), 'y': round(hy), 'escena': f'{clave}-listo', 'zona': f'bosque-{tema}',
        'encargo': {'pide': palabra(tema, pide), 'opciones': [palabra(tema, o) for o in opciones], 'x': round(ex), 'y': round(ey),
                    'escenaPide': f'{clave}-pide', 'escenaOtra': f'{clave}-otra', 'escenaGracias': f'{clave}-gracias', 'escenaListo': f'{clave}-listo'},
    })
    # Faroles en los dos claros.
    for claro in (a, b):
        fx, fy = mejor_borde(claro, claro['r'] + 18, 34, prohibido=('camino', 'agua'))
        objetos.append(O(4, 70, fx, fy, 10, True))
        ocupar(fx, fy, 40)
    # La tercera misión (Di y brilla), junto al vecino y sin encimarse con el primer farol,
    # con su casa ni con los faroles: el vecino quiere oír al niño.
    tercera = next(mi for mi in misiones if mi['id'] == f'bosque-{tema}-3')
    primera = next(mi for mi in misiones if mi['id'] == f'bosque-{tema}')
    evitar = [(primera['x'], primera['y'], 115), (hx, hy, 90)] + [(o['x'], o['y'], 80) for o in objetos]
    tercera['x'], tercera['y'] = sitio_cerca(hx, hy, evitar, a)
    ocupar(tercera['x'], tercera['y'], 60)
    # Pistas en el piso: del centro al primer claro, las palabras de la primera misión;
    # de ahí al segundo, las de la segunda.
    for parte, (p, q) in enumerate(((centro, a), (a, b))):
        lista = PALABRAS[tema][parte]
        for k, (x, y) in enumerate(puntos_del_camino(p, q, 78)):
            if math.hypot(x - ex, y - ey) < 175:
                continue
            huellas.append({'x': round(x), 'y': round(y), 'icono': lista[k % len(lista)]['icono'], 'mision': f'bosque-{tema}' + ('' if parte == 0 else '-2')})

# Puente: Nova en el puente y Rayo en el camino.
PUENTE = (2557, 1330)
t['puerta'].update({'x': PUENTE[0] - 30, 'y': PUENTE[1] + 10})
ocupar(PUENTE[0], PUENTE[1], 120)
tramo_puente = [pt for pt in ruta_entre(centro, {'x': PUENTE[0] - 190, 'y': PUENTE[1]}) if math.hypot(pt[0] - CX, pt[1] - CY) > centro['r'] + 60]
# La misión de la hora, a un lado del camino del puente, con Rayo el cartero más adelante.
# La segunda (decir la hora) va entre las dos, del mismo lado: Rayo pregunta.
hx, hy = tramo_puente[int(len(tramo_puente) * 0.3)]
rx, ry = tramo_puente[int(len(tramo_puente) * 0.72)]
misiones.append({
    'id': 'bosque-time', 'titulo': 'What time is it?', 'plantilla': 'escucha-toca', 'icono': I('reloj-3.webp'), 'palabras': RELOJES,
    'x': round(hx), 'y': round(hy - 135),
    'antes': [L('cosmo', 'El reloj del bosque se detuvo. Escucha la hora y toca el reloj correcto.', 'The forest clock stopped. Listen to the time and tap the right clock.')],
    'estrellas': ESTRELLAS_HORA[0],
})
ocupar(hx, hy - 135, 120)
misiones.append({
    'id': 'bosque-time-2', 'titulo': 'Tell Rayo the time', 'plantilla': 'di-brilla', 'icono': I('reloj-12.webp'),
    'palabras': [p for p in RELOJES if p['en'] in RELOJES_DECIR],
    'x': round((hx + rx) / 2), 'y': round((hy + ry) / 2 - 135),
    'antes': [L('rayo', '¡Rayo necesita saber la hora! Él pregunta "What time is it?" y tú le dices la hora.', 'Rayo needs to know the time! He asks "What time is it?" and you tell him.')],
    'estrellas': ESTRELLAS_HORA[1],
    'requiere': 'bosque-time',
})
ocupar((hx + rx) / 2, (hy + ry) / 2 - 135, 70)
habitantes.append({'id': 'rayo', 'personaje': 'rayo', 'x': round(rx), 'y': round(ry - 55), 'escena': 'rayo'})
ocupar(rx, ry - 55, 70)
pasos = tramo_puente[::20][1:]
for k, (x, y) in enumerate(pasos):
    antes_del_reloj = x < hx + 40
    huellas.append({'x': round(x), 'y': round(y), 'icono': RELOJES[k % len(RELOJES)]['icono'] if antes_del_reloj else '', 'mision': 'bosque-time' if antes_del_reloj else ''})
# Lumi, junto al camino de la familia.
tramo_lumi = puntos_del_camino(centro, CAMINO['family'][0], 60)
lx, ly = tramo_lumi[len(tramo_lumi) // 2]
habitantes.append({'id': 'lumi', 'personaje': 'lumi', 'x': round(lx + 95), 'y': round(ly - 40), 'escena': 'lumi'})
ocupar(lx + 95, ly - 40, 70)
# Memory de repaso junto al pozo de la plaza.
POZO['x'], POZO['y'] = sitio_cerca(CX, CY - 105, [(h['x'], h['y'], 90) for h in habitantes] + [(o['x'], o['y'], 80) for o in objetos] + [(CX, CY + 120, 80)])
misiones.append(POZO)
ocupar(POZO['x'], POZO['y'], 60)

# Faroles, señal y arbustos de la plaza.
for ang in (-125, -55, 30, 150):
    fx, fy = CX + math.cos(math.radians(ang)) * (centro['r'] - 25), CY + math.sin(math.radians(ang)) * (centro['r'] - 25) * 0.9
    if hay_sitio(fx, fy, 45) and clase(fx, fy) != 'camino':
        objetos.append(O(4, 70, fx, fy, 10, True))
        ocupar(fx, fy, 45)
sx, sy = CX + centro['r'] * 0.72, CY - centro['r'] * 0.25
objetos.append(O(5, 78, sx, sy, 12))
ocupar(sx, sy, 50)
for _ in range(2000):
    if sum(1 for o in objetos if 'objeto-7' in o['imagen']) >= 14:
        break
    x, y = random.uniform(150, MUNDO - 150), random.uniform(250, MUNDO - 100)
    zona = cuenta(x, y, 50)
    if zona['bosque'] > 0.55 and zona['camino'] > 0.08 and zona['agua'] == 0 and hay_sitio(x, y, 60):
        objetos.append(O(7, random.choice((70, 84)), x, y))
        ocupar(x, y, 55)

m['habitantes'] = habitantes
m['objetos'] = objetos
m['huellas'] = huellas

# ---------- Árboles ----------
tipos = [(f'mundo/arbol-{i}.webp',) + Image.open(f'public/cartillas/ingles-3/mundo/arbol-{i}.webp').size for i in range(1, 10)]
m['tiposArbol'] = [{'imagen': a, 'ancho': w, 'alto': h} for a, w, h in tipos]
arboles = []
for _ in range(26000):
    x, y = random.uniform(-20, MUNDO + 20), random.uniform(90, MUNDO + 100)
    if any(math.hypot(x - a['x'], (y - a['y']) * 1.25) < 122 for a in arboles):
        continue
    if not hay_sitio(x, y - 70, 95):
        continue
    tronco = cuenta(x, y - 10, 34)
    copa = cuenta(x, y - 80, 64)
    if tronco['agua'] + tronco['camino'] + tronco['claro'] > 0.02:
        continue
    if copa['claro'] > 0.04 or copa['camino'] > 0.1 or copa['agua'] > 0.3:
        continue
    arboles.append({'x': round(x), 'y': round(y), 'tipo': random.randrange(len(tipos)), 'escala': round(random.uniform(0.6, 0.9), 2)})
arboles.sort(key=lambda a: a['y'])
m['arboles'] = arboles


def tapa(a, x, y):
    w, h = tipos[a['tipo']][1] * a['escala'], tipos[a['tipo']][2] * a['escala']
    return abs(x - a['x']) < w * 0.5 + 28 and a['y'] - h - 28 < y < a['y'] + 28


# ---------- Luciérnagas y animales: siempre a la vista ----------
def sitio_visible(filtro, intentos=80000):
    """Busca un lugar y quita los árboles que lo taparían: lo que suena, se ve."""
    for _ in range(intentos):
        x, y = random.uniform(160, MUNDO - 160), random.uniform(260, MUNDO - 160)
        if filtro(x, y) and hay_sitio(x, y, 80):
            ocupar(x, y, 130)
            arboles[:] = [a for a in arboles if not tapa(a, x, y)]
            return round(x), round(y)
    raise SystemExit(f'no hay sitio visible para {filtro.__name__}')


def junto_al_camino(x, y):
    # Junto a un camino o al borde de un claro (sin manchas sueltas que cuenten como camino,
    # la franja se mide en 130 px y los bordes de los claros también sirven).
    zona = cuenta(x, y, 130)
    return clase(x, y) == 'bosque' and 0.05 < zona['camino'] + zona['claro'] < 0.5 and cuenta(x, y, 60)['agua'] == 0
def junto_al_agua(x, y):
    return clase(x, y) == 'bosque' and 0.06 < cuenta(x, y, 80)['agua'] < 0.6

m['luciernagas'] = [dict(zip('xy', sitio_visible(junto_al_camino))) for _ in range(10)]
A = lambda i: f'mundo/animal-{i}.webp'
PAL = {1: ('butterfly', 'mariposa'), 2: ('butterfly', 'mariposa'), 3: ('bee', 'abeja'), 4: ('owl', 'búho'), 5: ('frog', 'rana'), 6: ('bird', 'pájaro')}


def criatura(n, ancho, movimiento, radio, rapidez, lugar):
    return {'imagen': A(n), 'ancho': ancho, 'x': lugar[0], 'y': lugar[1], 'radio': radio, 'movimiento': movimiento, 'rapidez': rapidez,
            'palabra': {'en': PAL[n][0], 'es': PAL[n][1], 'icono': A(n), 'pronuncia': PRONUNCIA[PAL[n][0]]}}


m['criaturas'] = (
    [criatura(1 + k % 2, 46, 'revolotea', 90, 0.8 + 0.1 * k, sitio_visible(junto_al_camino)) for k in range(5)]
    + [criatura(3, 44, 'zumba', 70, 1.4 + 0.1 * k, sitio_visible(junto_al_camino)) for k in range(3)]
    + [criatura(5, 50, 'salta', 0, 1, sitio_visible(junto_al_agua)) for _ in range(3)]
    + [criatura(6, 58, 'planea', 260, 0.3, (round(CX - 500), round(CY - 420))), criatura(6, 58, 'planea', 260, 0.26, (round(CX + 450), round(CY + 520)))]
    + [criatura(4, 84, 'planea', 240, 0.2, (round(CX + 620), round(CY - 520))), criatura(4, 84, 'planea', 220, 0.18, (round(CX - 640), round(CY + 560)))]
)

# ---------- Agua: cuadrícula donde no se puede caminar (el puente sí se cruza) ----------
CELDA = 20
filas = []
for j in range(MUNDO // CELDA):
    fila = ''
    for i in range(MUNDO // CELDA):
        x, y = i * CELDA + CELDA / 2, j * CELDA + CELDA / 2
        n = sum(clase(x + dx, y + dy) == 'agua' for dx in (-6, 6) for dy in (-6, 6))
        puente = abs(x - PUENTE[0]) < 150 and abs(y - PUENTE[1]) < 75
        fila += '1' if n >= 3 and not puente else '0'
    filas.append(fila)
m['celda'] = CELDA
m['agua'] = filas

# ---------- Copas en primer plano: pocas, lejos de todo lo que hay que ver ----------
frente = []
for _ in range(6000):
    x, y = random.uniform(150, MUNDO - 150), random.uniform(300, MUNDO - 100)
    if any(math.hypot(x - fx, y - fy) < 620 for fx, fy, *_ in frente):
        continue
    if not hay_sitio(x, y, 330) or cuenta(x, y - 60, 170)['bosque'] < 0.985:
        continue
    frente.append((x, y, random.randrange(len(tipos))))
m['frente'] = [{'x': round(x), 'y': round(y), 'tipo': tp} for x, y, tp in frente]

m.update({'ancho': MUNDO, 'alto': MUNDO, 'luces': [{'x': round(CX), 'y': round(CY), 'radio': 480}], 'radioLuzMision': 420, 'colorPenumbra': 'rgb(16 8 46 / 0.62)'})
json.dump(c, open(ruta, 'w'), ensure_ascii=False, indent=1)
open(ruta, 'a').write('\n')

print('centro', round(CX), round(CY), round(centro['r']))
for tema, (a, b) in CAMINO.items():
    print(f"{tema:8} A=({a['x']:.0f},{a['y']:.0f}) r{a['r']:.0f}  B=({b['x']:.0f},{b['y']:.0f}) r{b['r']:.0f}")
print(len(arboles), 'árboles,', len(objetos), 'objetos,', len(huellas), 'pistas,', len(frente), 'copas al frente')
