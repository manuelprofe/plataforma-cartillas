"""Añade a cartilla.json los héroes, las estelas, los habitantes de Englishland, sus encargos y la aldea."""
import json, sys
ruta = sys.argv[1]
c = json.load(open(ruta))
t = c['territorios'][0]
m = t['mundo']
I = lambda n: f'iconos/{n}.svg'

c['heroes'] = [
    {'id': 'tavi', 'nombre': 'Tavi', 'imagen': 'personajes/heroe-1.webp', 'ancho': 64, 'saludo': {'es': '¡Hola! Soy Tavi.', 'en': 'Hello! I am Tavi.'}},
    {'id': 'mika', 'nombre': 'Mika', 'imagen': 'personajes/heroe-2.webp', 'ancho': 58, 'saludo': {'es': '¡Hola! Soy Mika.', 'en': 'Hello! I am Mika.'}},
    {'id': 'bruno', 'nombre': 'Bruno', 'imagen': 'personajes/heroe-3.webp', 'ancho': 64, 'saludo': {'es': '¡Hola! Soy Bruno.', 'en': 'Hello! I am Bruno.'}},
]
c['estelas'] = [
    {'id': 'oro', 'estrellas': 0, 'colores': ['#fff3a6', '#ffd95a']},
    {'id': 'menta', 'estrellas': 25, 'colores': ['#b6fff0', '#19c6b1']},
    {'id': 'rosa', 'estrellas': 50, 'colores': ['#ffd0e6', '#ff5fa2']},
    {'id': 'arcoiris', 'estrellas': 90, 'colores': ['#ff5f6d', '#ffc371', '#fff36b', '#6bffb0', '#6bc5ff', '#c58bff']},
]

P = t['personajes']
for clave in ('cosmo', 'pixie', 'lumi'):
    P[clave]['ancho'] = 96
vecinos = [('tito', 'Tito', 1, 78), ('pua', 'Púa', 2, 78), ('abu', 'Abu', 3, 82), ('nuez', 'Nuez', 4, 82), ('caro', 'Caro', 5, 88), ('rayo', 'Rayo', 6, 84)]
for clave, nombre, n, ancho in vecinos:
    P[clave] = {'nombre': nombre, 'imagen': f'personajes/vecino-{n}.webp', 'ancho': ancho}

def encargo(pide, opciones, x, y, clave):
    return {'pide': pide, 'opciones': opciones, 'x': x, 'y': y,
            'escenaPide': f'{clave}-pide', 'escenaOtra': f'{clave}-otra', 'escenaGracias': f'{clave}-gracias', 'escenaListo': f'{clave}-listo'}

red = {'en': 'red', 'es': 'rojo', 'icono': I('1f534')}
blue = {'en': 'blue', 'es': 'azul', 'icono': I('1f535')}
yellow = {'en': 'yellow', 'es': 'amarillo', 'icono': I('1f7e1')}
three = {'en': 'three', 'es': 'tres', 'icono': I('0033_20e3')}
five = {'en': 'five', 'es': 'cinco', 'icono': I('0035_20e3')}
eight = {'en': 'eight', 'es': 'ocho', 'icono': I('0038_20e3')}
pencil = {'en': 'pencil', 'es': 'lápiz', 'icono': I('270f')}
book = {'en': 'book', 'es': 'libro', 'icono': I('1f4d8')}
ruler = {'en': 'ruler', 'es': 'regla', 'icono': I('1f4cf')}

m['inicio'] = {'x': 882, 'y': 985}
m['habitantes'] = [
    {'id': 'pixie', 'personaje': 'pixie', 'x': 835, 'y': 900, 'escena': 'intro'},
    {'id': 'cosmo', 'personaje': 'cosmo', 'x': 955, 'y': 915, 'escena': 'cosmo'},
    {'id': 'lumi', 'personaje': 'lumi', 'x': 1130, 'y': 1190, 'escena': 'lumi'},
    {'id': 'tito', 'personaje': 'tito', 'x': 770, 'y': 835, 'escena': 'tito-listo', 'encargo': encargo(red, [blue, red, yellow], 500, 885, 'tito')},
    {'id': 'abu', 'personaje': 'abu', 'x': 1000, 'y': 815, 'escena': 'abu-listo', 'encargo': encargo(three, [five, three, eight], 1120, 610, 'abu')},
    {'id': 'caro', 'personaje': 'caro', 'x': 640, 'y': 1195, 'escena': 'caro-listo', 'encargo': encargo(pencil, [book, ruler, pencil], 530, 1345, 'caro')},
    {'id': 'pua', 'personaje': 'pua', 'x': 760, 'y': 1075, 'escena': 'pua'},
    {'id': 'nuez', 'personaje': 'nuez', 'x': 1020, 'y': 1105, 'escena': 'nuez'},
    {'id': 'rayo', 'personaje': 'rayo', 'x': 1330, 'y': 885, 'escena': 'rayo'},
]

E = t['escenas']
L = lambda quien, es, en, **mas: {'quien': quien, 'es': es, 'en': en, **mas}
E['ayuda'] = {'lineas': [
    L('cosmo', 'Toca la pantalla y caminas hasta tu dedo. ¡Puedes ir a donde quieras!', 'Touch the screen and you walk to your finger. You can go anywhere!'),
    L('pixie', 'Si ves una luciérnaga o un animal, acércate. Guardan palabras para tu álbum.', 'If you see a firefly or an animal, go near. They keep words for your album.'),
    L('pixie', 'Los vecinos del bosque perdieron sus palabras. ¡Ayúdalos a encontrarlas!', 'The forest neighbors lost their words. Help them find them!'),
], 'luego': 'elegir'}
E['cosmo'] = {'lineas': [L('cosmo', '¡Qué bueno verte! Los vecinos necesitan ayuda. Y los faroles también.', 'Good to see you! The neighbors need help. And so do the lanterns.')], 'luego': 'elegir'}
E['pua'] = {'lineas': [L('pua', 'Vendo frutas en mi carreta... pero olvidé cómo se llaman. ¡Gracias por traer la luz!', 'I sell fruit in my cart... but I forgot the names. Thank you for bringing the light!')]}
E['nuez'] = {'lineas': [L('nuez', 'Horneo pan para toda la aldea. Cuando vuelvan las palabras, haré una fiesta.', 'I bake bread for the whole village. When the words come back, I will make a party.')]}
E['rayo'] = {'lineas': [L('rayo', 'Llevo cartas al Valle de las Palabras, pero el puente está apagado. ¡Junta estrellas!', 'I carry letters to the Valley of Words, but the bridge is dark. Collect stars!')]}

def escenas_encargo(clave, lugar_es, lugar_en, palabra):
    E[f'{clave}-pide'] = {'lineas': [
        L(clave, f'¡Ay! Perdí una palabra y me quedé sin color. Se cayó {lugar_es}.', f'Oh no! I lost a word and I lost my color. It fell {lugar_en}.'),
        L(clave, '¿Me la traes? Escucha bien cuál es.', 'Can you bring it to me? Listen carefully.'),
    ]}
    E[f'{clave}-otra'] = {'lineas': [L(clave, 'Mmm, esa no es mi palabra. ¡No pasa nada! Escucha otra vez y prueba con otra.', 'Hmm, that is not my word. That is okay! Listen again and try another one.')]}
    E[f'{clave}-gracias'] = {'lineas': [
        L(clave, f'¡Esa es! ¡{palabra}! Mi palabra volvió y mi color también.', f'That is it! {palabra}! My word is back, and my color too.'),
        L(clave, '¡Gracias! La guardé en tu álbum para que no se pierda.', 'Thank you! I put it in your album so it never gets lost.'),
    ]}
    E[f'{clave}-listo'] = {'lineas': [L(clave, f'¡{palabra}! Ya no se me olvida. ¡Gracias, amigo!', f'{palabra}! I will never forget it. Thank you, friend!')]}

escenas_encargo('tito', 'en el camino de los colores', 'on the colors path', 'Red')
escenas_encargo('abu', 'en el camino de los números', 'on the numbers path', 'Three')
escenas_encargo('caro', 'en el camino de abajo', 'on the path below', 'Pencil')

O = lambda n, ancho, x, y, choque=0, luz=False: {'imagen': f'mundo/objeto-{n}.webp', 'ancho': ancho, 'x': x, 'y': y, 'choque': choque, **({'luz': True} if luz else {})}
m['objetos'] = [
    O(1, 190, 690, 790, 62), O(2, 190, 1070, 770, 62), O(3, 170, 1100, 1090, 56),
    O(6, 105, 882, 800, 38), O(9, 150, 680, 1075, 50), O(8, 120, 930, 1120, 26), O(5, 78, 1135, 915, 12),
    O(4, 70, 770, 668, 10, True), O(4, 70, 1000, 668, 10, True), O(4, 70, 655, 935, 10, True), O(4, 70, 830, 1130, 10, True),
    O(4, 70, 470, 1400, 10, True), O(4, 70, 1300, 1400, 10, True), O(4, 70, 1500, 820, 10, True), O(4, 70, 330, 380, 10, True), O(4, 70, 1230, 380, 10, True), O(4, 70, 300, 960, 10, True),
    O(7, 84, 610, 850), O(7, 84, 1165, 850), O(7, 70, 960, 660), O(7, 70, 800, 1150), O(7, 84, 1180, 1010),
]
m['colorPenumbra'] = 'rgb(16 8 46 / 0.66)'
palabras_animal = {1: ('butterfly', 'mariposa'), 2: ('butterfly', 'mariposa'), 3: ('bee', 'abeja'), 4: ('owl', 'búho'), 5: ('frog', 'rana'), 6: ('bird', 'pájaro')}
for cr in m.get('criaturas', []):
    n = int(cr['imagen'].split('-')[-1].split('.')[0])
    en, es = palabras_animal[n]
    cr['palabra'] = {'en': en, 'es': es, 'icono': cr['imagen']}
json.dump(c, open(ruta, 'w'), ensure_ascii=False, indent=2)
open(ruta, 'a').write('\n')
print('ok')
