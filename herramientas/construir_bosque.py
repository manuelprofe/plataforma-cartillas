"""Arma el Bosque de los Sonidos sobre la imagen del suelo y lo escribe en cartilla.json.

Lee los colores del suelo para encontrar los claros, los caminos y el agua, y con eso:
reparte las misiones (dos por camino), los habitantes y sus casas sin que se encimen,
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

from PIL import Image

suelo, ruta = sys.argv[1], sys.argv[2]
random.seed(11)

MUNDO = 2800
N = 700  # cuadrícula de análisis
E = MUNDO / N
im = Image.open(suelo).convert('RGB').resize((N, N))
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
I = lambda n: f'iconos/{n}.svg'
W = lambda en, es, icono: {'en': en, 'es': es, 'icono': I(icono)}
L = lambda quien, es, en, **mas: {'quien': quien, 'es': es, 'en': en, **mas}

PALABRAS = {
    'school': (
        [W('pencil', 'lápiz', '270f'), W('eraser', 'borrador', '1f9fd'), W('notebook', 'cuaderno', '1f4d3'), W('ruler', 'regla', '1f4cf'), W('scissors', 'tijeras', '2702')],
        [W('backpack', 'mochila', '1f392'), W('book', 'libro', '1f4d8'), W('marker', 'marcador', '1f58a'), W('crayon', 'crayón', '1f58d'), W('chair', 'silla', '1fa91')],
    ),
    'colors': (
        [W('red', 'rojo', '1f534'), W('blue', 'azul', '1f535'), W('green', 'verde', '1f7e2'), W('yellow', 'amarillo', '1f7e1'), W('orange', 'naranja', '1f7e0')],
        [W('purple', 'morado', '1f7e3'), W('pink', 'rosado', 'color-pink'), W('brown', 'café', 'color-brown'), W('black', 'negro', 'color-black'), W('white', 'blanco', 'color-white')],
    ),
    'numbers': (
        [W('one', 'uno', '0031_20e3'), W('two', 'dos', '0032_20e3'), W('three', 'tres', '0033_20e3'), W('four', 'cuatro', '0034_20e3'), W('five', 'cinco', '0035_20e3')],
        [W('six', 'seis', '0036_20e3'), W('seven', 'siete', '0037_20e3'), W('eight', 'ocho', '0038_20e3'), W('nine', 'nueve', '0039_20e3'), W('ten', 'diez', '1f51f')],
    ),
    'body': (
        [W('head', 'cabeza', '1f642'), W('eyes', 'ojos', '1f440'), W('ears', 'orejas', '1f442'), W('nose', 'nariz', '1f443')],
        [W('mouth', 'boca', '1f444'), W('hands', 'manos', '1f64c'), W('arms', 'brazos', '1f4aa'), W('legs', 'piernas', '1f9b5'), W('feet', 'pies', '1f9b6')],
    ),
    'family': (
        [W('hello', 'hola', '1f44b'), W('good morning', 'buenos días', '1f305'), W('good night', 'buenas noches', '1f319'), W('thank you', 'gracias', '1f64f')],
        [W('mother', 'mamá', '1f469'), W('father', 'papá', '1f468'), W('sister', 'hermana', '1f467'), W('brother', 'hermano', '1f466'), W('grandmother', 'abuela', '1f475'), W('grandfather', 'abuelo', '1f474'), W('baby', 'bebé', '1f476')],
    ),
}
TITULOS = {
    'school': ('School objects', 'More school objects', '1f392', '1f4d8'),
    'colors': ('Colors', 'More colors', '1f7e3', 'color-pink'),
    'numbers': ('Numbers 1 to 5', 'Numbers 6 to 10', '0033_20e3', '0038_20e3'),
    'body': ('My face', 'My body', '1f440', '1f64c'),
    'family': ('Hello!', 'My family', '1f44b', '1f469'),
}
ANTES = {
    'school': (
        L('cosmo', 'Aquí se apagaron los útiles de la escuela. Escucha y toca el correcto.', 'The school objects lost their light here. Listen and tap the right one.'),
        L('cosmo', '¡Quedan más útiles por encender! Escucha con atención.', 'There are more school objects to light up! Listen carefully.'),
    ),
    'colors': (
        L('cosmo', 'Los colores del bosque se volvieron grises. ¡Vamos a encenderlos!', "The colors of the forest turned gray. Let's light them up!"),
        L('cosmo', 'Faltan cinco colores para que el bosque brille completo.', 'Five more colors and the forest will shine again.'),
    ),
    'numbers': (
        L('cosmo', 'Los números se escondieron entre los árboles. Empecemos del uno al cinco.', 'The numbers are hiding in the trees. Let us start from one to five.'),
        L('cosmo', '¡Ya sabes hasta el cinco! Ahora del seis al diez.', 'You know up to five! Now from six to ten.'),
    ),
    'body': (
        L('cosmo', 'Cabeza, ojos, orejas, nariz... ¿los conoces en inglés?', 'Head, eyes, ears, nose... do you know them in English?'),
        L('cosmo', 'Ahora el resto del cuerpo: manos, brazos, piernas y pies.', 'Now the rest of the body: hands, arms, legs and feet.'),
    ),
    'family': (
        L('cosmo', 'Aquí aprendemos a saludar y a dar las gracias.', 'Here we learn to say hello and thank you.'),
        L('cosmo', '¿Quién vive en tu casa? Vamos a nombrar a la familia.', 'Who lives in your house? Let us name the family.'),
    ),
}

# Las estrellas se dan al completar cada misión y entre todas suman lo que pide el puente:
# cinco primeras de 4, cinco segundas de 5 y la de la hora de 5 son 50.
ESTRELLAS_POR_MISION = (4, 5)
ESTRELLAS_HORA = 5
RELOJES = [W("one o'clock", 'la una', '1f550'), W("three o'clock", 'las tres', '1f552'), W("six o'clock", 'las seis', '1f555'),
           W("nine o'clock", 'las nueve', '1f558'), W("ten o'clock", 'las diez', '1f559'), W("twelve o'clock", 'las doce', '1f55b')]

misiones = []
for tema in ('school', 'colors', 'numbers', 'body', 'family'):
    a, b = CAMINO[tema]
    for parte, claro in enumerate((a, b)):
        misiones.append({
            'id': f'bosque-{tema}' + ('' if parte == 0 else '-2'),
            'titulo': TITULOS[tema][parte],
            # La primera misión del camino presenta las palabras escuchando; la segunda las
            # practica con la voz (o escribiéndolas si no hay micrófono).
            'plantilla': ('escucha-toca', 'di-brilla')[parte],
            'icono': I(TITULOS[tema][2 + parte]),
            'palabras': PALABRAS[tema][parte],
            'x': round(claro['x']),
            'y': round(claro['y'] - 10),
            'antes': [ANTES[tema][parte]],
            'estrellas': ESTRELLAS_POR_MISION[parte],
            **({'requiere': f'bosque-{tema}'} if parte else {}),
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

TEXTOS = {
    'caro': {
        'pide': [
            L('caro', 'Hooola... Soy Caro. Voy despacito, despacito... y se me cayó una palabra de la mochila.', 'Hellooo... I am Caro. I go slowly, slowly... and a word fell out of my backpack.'),
            L('caro', 'Está más adelante, en este camino. Escucha cuál es y tráemela, ¿sí?', 'It is up ahead, on this path. Listen to the word and bring it to me, okay?'),
        ],
        'otra': [L('caro', 'Mmm... esa no es. ¡No pasa nada! Yo también me equivoco. Escucha otra vez.', 'Hmm... not that one. That is okay! I make mistakes too. Listen again.')],
        'gracias': [
            L('caro', '¡Esa es! ¡Eraser! Ya puedo borrar y volver a intentar.', 'That is it! Eraser! Now I can erase and try again.'),
            L('caro', 'La guardé en tu álbum. ¡Gracias por no ir tan rápido como los demás!', 'I put it in your album. Thank you for not rushing like everybody else!'),
        ],
        'listo': [L('caro', 'Eraser, eraser... la repito despacito para que no se me vuelva a caer.', 'Eraser, eraser... I say it slowly so it never falls again.')],
    },
    'tito': {
        'pide': [
            L('tito', '¡Hola! Soy Tito. Mi sombrero tenía un color muy bonito... ¡y olvidé cómo se llama!', 'Hello! I am Tito. My hat had a beautiful color... and I forgot its name!'),
            L('tito', 'La palabra rodó por este camino. Escúchala y tráemela, por favor.', 'The word rolled down this path. Listen to it and bring it to me, please.'),
        ],
        'otra': [L('tito', '¡Uy! Ese no es el color de mi sombrero. ¡Tranquilo! Escucha otra vez y prueba otro.', 'Oops! That is not the color of my hat. No worries! Listen again and try another one.')],
        'gracias': [
            L('tito', '¡Red! ¡Mi sombrero es red! ¡Mira cómo brilla!', 'Red! My hat is red! Look how it shines!'),
            L('tito', 'Ya está en tu álbum. ¡Eres el mejor explorador del bosque!', 'It is in your album now. You are the best explorer in the forest!'),
        ],
        'listo': [L('tito', '¡Red como mi sombrero! Cuando lo veas, acuérdate de mí.', 'Red like my hat! When you see it, think of me.')],
    },
    'abu': {
        'pide': [
            L('abu', 'Buenas, pequeño explorador. Soy Abu. Llevo cien años contando las piedras del camino...', 'Good day, little explorer. I am Abu. I have counted the stones on this path for a hundred years...'),
            L('abu', '...y hoy se me perdió un número. Está más adelante. Escucha bien cuál es.', '...and today I lost a number. It is up ahead. Listen carefully.'),
        ],
        'otra': [L('abu', 'Mmm, ese es otro número. Los sabios también se equivocan. Escucha de nuevo, con calma.', 'Hmm, that is a different number. Wise ones make mistakes too. Listen again, calmly.')],
        'gracias': [
            L('abu', '¡Three! One, two, three... ¡ya puedo seguir contando!', 'Three! One, two, three... now I can keep counting!'),
            L('abu', 'Guárdalo en tu álbum. Un número nunca sobra.', 'Keep it in your album. A number is always useful.'),
        ],
        'listo': [L('abu', 'One, two, three... ¿cuentas conmigo?', 'One, two, three... will you count with me?')],
    },
    'pua': {
        'pide': [
            L('pua', '¡Frutas, frutas frescas! Soy Púa... pero hoy no huelo nada. ¡Nada de nada!', 'Fruit, fresh fruit! I am Púa... but today I cannot smell a thing. Nothing at all!'),
            L('pua', 'Se me perdió la palabra de lo que uso para oler. ¿Me la buscas en este camino?', 'I lost the word for what I smell with. Can you find it on this path?'),
        ],
        'otra': [L('pua', '¡Ja, ja! Con eso no se huele. ¡No importa! Escucha otra vez y prueba con otra.', 'Ha ha! You cannot smell with that. Never mind! Listen again and try another one.')],
        'gracias': [
            L('pua', '¡Nose! ¡Esa es! Mmm... ¡qué rico huelen mis frutas!', 'Nose! That is it! Mmm... my fruit smells so good!'),
            L('pua', 'Toma, va para tu álbum. ¡Y gracias por ayudarme!', 'Here, it goes in your album. And thank you for helping me!'),
        ],
        'listo': [L('pua', 'Con mi nose huelo las frutas. ¿Y tú, qué hueles?', 'With my nose I smell the fruit. And you, what can you smell?')],
    },
    'nuez': {
        'pide': [
            L('nuez', '¡Pan calientito! Soy Nuez, la panadera. Quiero saludar a todos los que pasan...', 'Warm bread! I am Nuez, the baker. I want to greet everyone who walks by...'),
            L('nuez', '...pero olvidé cómo se saluda. La palabra se fue por este camino. ¿Me la traes?', '...but I forgot how to say it. The word went down this path. Can you bring it?'),
        ],
        'otra': [L('nuez', '¡Casi! Esa es bonita, pero no es para saludar. Escucha otra vez. ¡Tú puedes!', 'Almost! That is a nice one, but it is not for greeting. Listen again. You can do it!')],
        'gracias': [
            L('nuez', '¡Hello! ¡Hello, hello! ¡Ya puedo saludar a todo el bosque!', 'Hello! Hello, hello! Now I can greet the whole forest!'),
            L('nuez', 'Queda en tu álbum. Y cuando vuelvan todas las palabras, haré una fiesta con pan.', 'It is in your album. And when all the words come back, I will make a bread party.'),
        ],
        'listo': [L('nuez', '¡Hello, explorador! ¿Ves? Ya no se me olvida.', 'Hello, explorer! See? I never forget it now.')],
    },
}

E_['ayuda'] = {'lineas': [
    L('cosmo', 'Toca la pantalla y caminas hasta tu dedo. ¡Puedes ir a donde quieras!', 'Touch the screen and you walk to your finger. You can go anywhere!'),
    L('pixie', 'Sigue los dibujos del piso: cada camino te cuenta a dónde lleva.', 'Follow the pictures on the ground: each path tells you where it goes.'),
    L('pixie', 'Los vecinos del bosque perdieron sus palabras. ¡Ayúdalos a encontrarlas!', 'The forest neighbors lost their words. Help them find them!'),
], 'luego': 'elegir'}
E_['cosmo'] = {'lineas': [L('cosmo', '¡Qué bueno verte! Hay faroles por encender y vecinos que necesitan ayuda.', 'Good to see you! There are lanterns to light and neighbors who need help.')], 'luego': 'elegir'}
E_['dormida'] = {'lineas': [L('cosmo', 'Este farol todavía duerme. Despierta cuando enciendas el que está antes en este camino.', 'This lantern is still asleep. It wakes up when you light the one before it on this path.')]}
E_['rayo'] = {'lineas': [
    L('rayo', '¡Correo, correo! Soy Rayo. Llevo cartas al Valle de las Palabras...', 'Mail, mail! I am Rayo. I carry letters to the Valley of Words...'),
    L('rayo', '...pero siempre llego tarde: el reloj del bosque se apagó y el puente también.', '...but I am always late: the forest clock went dark, and so did the bridge.'),
    L('rayo', 'Completa todas las misiones. Con las 50 estrellas, el puente se enciende.', 'Complete all the missions. With all 50 stars, the bridge lights up.'),
]}
E_['puente-cerrado'] = {'lineas': [
    L('nova', 'Soy Nova. Este puente lleva al Valle de las Palabras.', 'I am Nova. This bridge goes to the Valley of Words.'),
    L('nova', 'Cada misión que completas me da estrellas. Cuando las completes todas, tendré 50 y el puente se encenderá.', 'Every mission you complete gives me stars. When you complete them all, I will have 50 and the bridge will light up.'),
]}


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
    ocupar(tm['x'], tm['y'], 95)

CASA = {'tito': (1, 190, 62), 'nuez': (2, 190, 62), 'abu': (3, 170, 56), 'pua': (9, 150, 50), 'caro': (5, 78, 12)}
for tema in ('school', 'colors', 'numbers', 'body', 'family'):
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
hx, hy = tramo_puente[int(len(tramo_puente) * 0.3)]
misiones.append({
    'id': 'bosque-time', 'titulo': 'What time is it?', 'plantilla': 'escucha-toca', 'icono': I('1f552'), 'palabras': RELOJES,
    'x': round(hx), 'y': round(hy - 135),
    'antes': [L('cosmo', 'El reloj del bosque se detuvo. Escucha la hora y toca el reloj correcto.', 'The forest clock stopped. Listen to the time and tap the right clock.')],
    'estrellas': ESTRELLAS_HORA,
})
ocupar(hx, hy - 135, 120)
assert sum(mi['estrellas'] for mi in misiones) == t['puerta']['estrellas'], 'las estrellas de las misiones deben sumar lo que pide el puente'
rx, ry = tramo_puente[int(len(tramo_puente) * 0.72)]
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

# Faroles, señal y arbustos de la plaza.
for ang in (-125, -55, 30, 150):
    fx, fy = CX + math.cos(math.radians(ang)) * (centro['r'] - 25), CY + math.sin(math.radians(ang)) * (centro['r'] - 25) * 0.9
    if hay_sitio(fx, fy, 45) and clase(fx, fy) != 'camino':
        objetos.append(O(4, 70, fx, fy, 10, True))
        ocupar(fx, fy, 45)
sx, sy = CX + centro['r'] * 0.72, CY - centro['r'] * 0.25
objetos.append(O(5, 78, sx, sy, 12))
ocupar(sx, sy, 50)
for _ in range(400):
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
    return clase(x, y) == 'bosque' and 0.05 < cuenta(x, y, 90)['camino'] < 0.5 and cuenta(x, y, 60)['agua'] == 0
def junto_al_agua(x, y):
    return clase(x, y) == 'bosque' and 0.06 < cuenta(x, y, 80)['agua'] < 0.6

m['luciernagas'] = [dict(zip('xy', sitio_visible(junto_al_camino))) for _ in range(10)]
A = lambda i: f'mundo/animal-{i}.webp'
PAL = {1: ('butterfly', 'mariposa'), 2: ('butterfly', 'mariposa'), 3: ('bee', 'abeja'), 4: ('owl', 'búho'), 5: ('frog', 'rana'), 6: ('bird', 'pájaro')}


def criatura(n, ancho, movimiento, radio, rapidez, lugar):
    return {'imagen': A(n), 'ancho': ancho, 'x': lugar[0], 'y': lugar[1], 'radio': radio, 'movimiento': movimiento, 'rapidez': rapidez,
            'palabra': {'en': PAL[n][0], 'es': PAL[n][1], 'icono': A(n)}}


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
