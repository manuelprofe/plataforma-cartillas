# Diseño, ronda 2: el mapa del Bosque de los Sonidos

Diseñador. 17 de noviembre de 2026. Responde al informe de Manuel tras las pruebas con conocidos:
(1) los tocables del mapa quedan pegados y se toca lo que no era; (2) el niño se pierde y no sabe
qué sigue. Parte de `CLAUDE.md`, `CONTINUAR.md`, `docs/referencias/juegos.md` y del mapa real,
medido en un navegador a 390 × 844 (también 768 × 1024 y 1366 × 768). Fase: diseñar; no hay código
nuevo. Las capturas están en `docs/diseno/ronda-2/`.

Lo medido está marcado como **medido**; lo demás es criterio de diseño y se confirma en el piloto.

---

## 1. Qué pasa hoy (medido)

Escala del mundo a 390 × 844: 0,844. En pantalla se ven 462 × 1000 px de un mundo de 2800 × 2800:
**el 5,9 % del bosque**.

### 1.1 Tocables: tamaños y pares que chocan

| Tocable | Caja de toque a 390 px | A 768 px | A 1366 px |
| --- | --- | --- | --- |
| Farol de misión (`.nodo`) | 81 × 81 (disco visible 64) | 98 × 98 | 131 × 131 |
| Personaje (`.habitante`) | 93 × 84 | 113 × 102 | 150 × 137 |
| Puente (`.puerta`) | 127 × 111 | 154 × 135 | 205 × 180 |
| Palabra de un encargo (`.toma`) | 66 × 66 | | |
| Botones de la esquina | 62 × 62, separados 12 | igual | igual |

Ningún tocable es pequeño. El problema es dónde están puestos:

| Par (se repite en los cinco caminos) | Distancia entre centros | Resultado |
| --- | --- | --- |
| Vecino y tercer farol de su camino: Caro, Tito y Abu | 75 a 76 px | **Se montan 32 × 29 px** |
| Vecino y tercer farol: Púa y Nuez | 83 a 84 px | **Se montan 14 × 40 px** |
| Vecino y primer farol (los cinco) | 104 a 108 px | Quedan a 3 a 6 px (el mínimo es 12) |
| Primer y tercer farol: cuerpo y familia | 98 px | 15 px: cumple, justo |
| Lumi y el botón del vestidor, a 768 px | 56 px | **Se montan 62 × 26 px** (el mundo pasa por debajo de los botones) |

Son 5 pares montados y 5 pares a menos de 12 px en el celular. En tableta y proyector los mismos
pares siguen montados, porque todo crece junto.

Además de las cajas:

- **El personaje se para encima.** Al tocar un farol, el personaje camina hasta 52 px por debajo
  de su centro. En los cinco claros ese punto cae entre el vecino y el tercer farol: el personaje
  (que no se toca, pero tapa) queda sobre los dos. Ver `04-claro-escuela.webp` y
  `05-claro-escuela-cajas-de-toque.webp` (las cajas rojas son las zonas de toque reales).
- **Fallar por poco cambia de acción.** Un toque a 5 px fuera de la caja ya no es "abrir el farol":
  es "camina hasta aquí". El niño ve que el personaje se mueve y no pasa nada más.
- **Los globos de aviso** (el signo de admiración del vecino) sobresalen de la caja y no se tocan.
- **Cosas que parecen botones y no lo son:** las huellas del camino (círculos punteados con un
  dibujo) y la flecha amarilla de la brújula, que es igual a un botón de "volver"
  (`06-encargo-y-brujula.webp`).

### 1.2 Por qué se pierde

| Qué le dice hoy "ve aquí ahora" | Funciona |
| --- | --- |
| Menú de Cosmo "¿A dónde vamos primero?" | Solo el primer día, solo si elige "¡Sí, vamos!", con **tres opciones escritas** de seis caminos (`01-primer-dia-menu-texto.webp`). Es la única vez que se fija un destino |
| Brújula | Solo aparece si hay destino elegido o encargo en curso. Parece un botón y no responde |
| Farol que salta (`nodo--siguiente`) | Solo el elegido en el menú, y está fuera de la pantalla |
| Mini mapa | Solo se mira. Dibujos de 18 px. Los vecinos tapan los faroles (`07-mini-mapa.webp`) |
| Puntitos de luz | Aparecen después de tocar un destino: no sirven para encontrarlo |
| Cosmo tras cada misión: "¿A dónde vamos ahora?" | Pregunta, no señala |

Lo que encuentra el niño:

1. **Al llegar a la plaza no hay ningún farol despierto a la vista** (`02-plaza-recien-llegado.webp`).
   Se ven Pixie, Cosmo, el pozo dormido y seis salidas iguales. El farol más cercano está a una
   pantalla entera de distancia.
2. **A mitad del territorio la plaza se ve igual que el primer día** (`03-plaza-a-mitad.webp`): el
   avance no se nota donde el niño aparece.
3. **El orden de cada camino va y vuelve.** El primer farol está en el claro cercano, el segundo al
   fondo del camino (530 px más allá, fuera de pantalla) y el tercero otra vez junto al primero.
   El tercero, dormido, es lo que queda al lado: el niño lo toca, y Cosmo responde con una frase
   larga ("despierta cuando enciendas el que está antes en este camino") cuando "el que está antes"
   no se ve.
4. **El primer día 12 de 18 faroles están dormidos** y se ven como botones grises.
5. **Dos contadores arriba** (estrellas y "0/10" de luciérnagas) y, en el puente, "16/17"
   (`08-casi-al-final-puente.webp`).
6. **Navegar pide leer un mapa.** Con el 6 % del mundo en pantalla hay que recordar dónde queda cada
   cosa. Esa orientación "de mapa" se forma entre los 5 y los 8 años (`juegos.md` §1.2); la de
   "sigue la ruta" ya está a los 5.

Conclusión: los choques se arreglan moviendo cosas. Perderse no: viene de pedirle al niño que
decida a dónde ir en un mundo que casi no ve.

---

## 2. Tres modelos

| | A. Bosque libre con guía fuerte | B. Un solo sendero de faroles | C. Mirador y senderos |
| --- | --- | --- | --- |
| Idea | El mundo de hoy. Se separan los tocables, Lumi vuela siempre hacia lo que sigue y el mini mapa lleva | Una fila única de 18 faroles por todo el bosque, como un mapa de niveles | Dos vistas: el bosque entero para escoger un lugar (7 botones grandes) y, dentro, un sendero corto de paradas en orden |
| Cómo se mueve | Camina libre a donde toque | Solo al farol siguiente | Solo entre paradas; el personaje ya está junto a lo que sigue |
| Qué sigue | Hay que seguir a Lumi por un mundo que no se ve | Evidente | Evidente: está en pantalla, pulsa y Lumi está encima |
| Tocar mal | Sigue existiendo "toqué al lado y caminó" | No | No: el toque se va a la parada más cercana o no hace nada |
| Elegir | Todo | Nada | Elige lugar (seis caminos y la plaza) |
| Plan por semanas (un tema = un camino) | Encaja | **No encaja**: la docente elige el tema, la fila impone un orden | Encaja: el lugar del día es el camino del tema |
| Preescolar | Difícil | Sirve | Sirve |
| Arte | Igual | Igual, pero el bosque radial obliga a pasar seis veces por la plaza | Igual |
| Código que se conserva | Casi todo | Motor de dibujo y rutas | Motor de dibujo, cámara, penumbra, `rutas.ts`, diálogos, álbum, vestidor |
| Costo | Pequeño | Mediano | Mediano |
| Riesgo | Arregla el punto 1 del informe y solo alivia el 2 | Quita la autonomía (Ryan y Deci) | Se pierde el paseo libre |

**Recomiendo C.** Razones:

1. Responde a las dos quejas, no a una. A es el arreglo barato, pero deja el origen del "me perdí".
2. Convierte "leer un mapa" en "seguir una ruta", que es lo que un niño de 5 a 9 años ya sabe
   hacer, y conserva una decisión de verdad: a qué lugar ir.
3. Es el dibujo de lo ya decidido: una semana es un tema y cada tema es un camino
   (`docs/pedagogia/ronda-1.md` §3.2).
4. La sesión de 15 minutos deja de gastarse caminando (hoy, 30 a 60 s por trayecto).
5. No hace falta arte nuevo.

Lo que se pierde es caminar a cualquier parte. Es la decisión 1 para Manuel.

---

## 3. Modelo recomendado: Mirador y senderos

Vocabulario para construir: **lugar** (un camino con sus paradas, o la plaza), **parada** (algo que
se toca: farol, vecino, pozo, puente), **mirador** (el bosque entero), **sendero** (el mundo de hoy
visto de cerca, dentro de un lugar), **pie** (dónde se para el personaje junto a una parada).

### 3.1 Lugares y paradas del Bosque

| Lugar | Paradas en orden, de la plaza hacia afuera | Dibujo en el mirador |
| --- | --- | --- |
| Plaza | Pixie, Cosmo, pozo (Memory, opcional) | El pozo |
| Escuela, colores, números, cuerpo, familia | Farol 1 (claro cercano, donde está hoy) → farol 2 (mitad del camino, donde hoy aparecen las palabras del encargo) → farol 3 (fondo del camino, donde hoy está el 2). El vecino queda junto al farol 1, a un lado | El icono del tema |
| Reloj | Farol de la hora → segundo farol → Rayo → puente | El reloj |

El orden deja de ir y volver: siempre hacia afuera. Comprobado con los datos actuales: los puntos
propuestos están sobre lo caminable (a menos de 12 px del camino) y dos faroles seguidos nunca
quedan a más de 301 px de mundo en horizontal ni 323 en vertical, así que **el personaje y el
farol siguiente siempre caben juntos en pantalla**, en vertical y en horizontal.

El poste de farol que ya está pintado junto a cada misión (`objeto-4.webp`) pasa a **ser** el
farol: apagado si duerme, encendido si está hecho. Hoy hay 12 postes; faltan 5 con la misma imagen.

### 3.2 Mirador a 390 px

Boceto con el mapa real: `ronda-2/11-boceto-mirador.webp`.

```
┌──────────────────────────────────────┐
│ (★ 15)                               │  estrellas: igual que hoy
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  Lumi                            │ │  mapa pintado completo, 366 × 366,
│ │ ((MOCHILA))            ( 3 )     │ │  borde crema 5 px, esquinas 28 px
│ │   ● ○ ○                ○ ○ ○     │ │
│ │                                  │ │  lugar: disco de 72 px
│ │ (COLOR)    yo·(POZO)   (RELOJ)   │ │  plaza: disco de 64 px
│ │  ○ ○ ○                  ○ ○      │ │  ● ○ = farolitos del lugar (14 px,
│ │                                  │ │        no se tocan, sin números)
│ │   (OJOS)               (MANO)    │ │
│ │    ○ ○ ○                ○ ○ ○    │ │  (( )) = lugar del día: aro que pulsa
│ └──────────────────────────────────┘ │          y Lumi encima
│                                      │
│               ( yo )                 │  volver a donde estaba, 76 px
└──────────────────────────────────────┘
```

- Siete tocables. Distancia mínima entre centros medida sobre el mapa: 92 px (plaza y reloj), que
  deja 24 px libres; el resto, 108 px o más.
- **El avance se ve aquí:** cada lugar está en penumbra hasta su primer farol, y la luz crece con
  cada uno (la misma penumbra del mundo). A mitad del territorio el mirador ya no se parece al del
  primer día.
- Tocar un lugar: el disco se hunde (120 ms), Lumi lleva al personaje en una burbuja de luz sobre
  el mapa (700 ms) y la vista entra al sendero (350 ms). Voz: el nombre del lugar.
- Todos los lugares están abiertos desde el primer día (autonomía). Solo uno pulsa.
- El mirador reemplaza al mini mapa y al menú escrito de Cosmo. Se abre con el botón del mapa.

### 3.3 Sendero a 390 px

Boceto con el mapa real (sin árboles; los círculos punteados son las zonas de toque):
`ronda-2/10-boceto-sendero.webp`.

```
┌──────────────────────────────────────┐
│ (★ 15)                               │
│      ¡                               │  farol 3 dormido: poste apagado, 44 px
│                                      │
│        Lumi                          │
│      ((LIBRO))   ← siguiente: disco  │  81 px visibles, zona de toque 101 px,
│         ·           de farol         │  aro que pulsa, Lumi encima
│          ·                           │  puntitos de luz desde el personaje
│           ·                          │
│        yo  (MOCHILA) ← hecho, dorado │  68 px visibles, zona de toque 84 px
│                                      │
│   (Caro)                      ( yo ) │  vecino: 84 px de zona
│                               (libro)│  vestidor, álbum, mapa: 62 px
│                               (mapa) │
└──────────────────────────────────────┘
```

Es el mundo de hoy (suelo, árboles, casas, animales, penumbra, cámara). Cambia cómo se toca:

| Al tocar | Pasa |
| --- | --- |
| El farol siguiente | El personaje camina hasta su pie (1,5 s como máximo) y se abre el diálogo de la misión. Un toque |
| Un farol ya encendido | Igual: se puede volver a jugar |
| La parada donde ya está | Se abre de inmediato |
| El vecino | Camina y se abre su encargo (3.6) |
| Un farol dormido | El poste se mece, sonido suave, Lumi salta sobre el que sí brilla. Sin diálogo. La primera vez, Lumi lo dice con voz |
| El suelo, un árbol, una huella | Onda gris y Lumi da un saltito sobre el farol siguiente. **El personaje no camina.** Al segundo toque al suelo en 5 s, una mano muestra dónde tocar |
| El botón del mapa | Abre el mirador |

La cámara encuadra al personaje y a la parada siguiente a la vez, dentro de la zona segura
(fuera de la barra de arriba y de la columna de botones). Por eso no hacen falta brújula ni mini
mapa.

### 3.4 Tamaños, separación y regla para los choques

Los tocables del mundo crecen con la escala del mundo (0,75 en un celular de 360 × 640; 0,844 a
390 × 844; 1,02 en tableta; 1,37 en proyector). Se fijan en píxeles de mundo para que cumplan en
la pantalla más pequeña:

| Parada | Visible (mundo) | Radio de toque (mundo) | En pantalla a 360 px | A 390 px |
| --- | --- | --- | --- | --- |
| Farol siguiente | 96 | 60 | 72 visible, 90 de toque | 81 y 101 |
| Farol encendido, vecino, pozo, puente | 80 | 50 | 60 y 75 | 68 y 84 |
| Farol dormido | 52 | 36 | 39 y 54 | 44 y 61 |

Reglas, en este orden:

1. **La zona de toque es un círculo**, no la caja de la imagen. Una sola función decide el toque:
   gana la parada cuyo borde esté más cerca del dedo, si el dedo cae dentro de su radio más 12 px
   de tolerancia. Así un toque nunca se reparte entre dos.
2. **Dos paradas nunca a menos de 150 px de mundo entre centros** (127 px en pantalla a 390). Deja
   al menos 15 px libres entre zonas en la pantalla más pequeña.
3. **El pie del personaje** va a un lado de su parada (75 px al lado, 35 abajo), del lado con más
   espacio, y a 110 px o más de cualquier otra parada. El personaje nunca tapa un tocable.
4. **Dos faroles seguidos caben en un cuadro de 340 × 340 px de mundo.**
5. **Si dos cosas chocan, se mueve la de menor rango**: farol > vecino > pozo y puente > adornos
   (postes, casas, bancas, animales). Se corre por el camino, alejándose de la plaza, en pasos de
   20 px hasta cumplir la regla 2; si se sale de su claro, pasa al otro lado del camino.
6. **Los animales** no vuelan a menos de 90 px de una parada. **Las huellas** se quedan como adorno
   sin borde punteado, para que no parezcan botones.
7. **Los botones fijos** (62 px, separados 12) no cambian. En pantallas de 1024 px o más crecen a
   76 px. Ninguna parada queda debajo de ellos (zona segura de la cámara).
8. **El guion que arma el mapa se detiene con un mensaje si una regla no se cumple.** El choque no
   puede volver sin que alguien lo vea.

### 3.5 Cómo se señala lo que sigue, sin leer

Una sola cosa llama la atención en cada pantalla. En capas, de la más silenciosa a la más clara:

| Cuándo | Qué se ve y se oye |
| --- | --- |
| Siempre | El personaje está junto a lo que sigue. El farol siguiente es el más grande, con aro dorado que pulsa cada 1,6 s y Lumi encima. Lo dormido es pequeño, apagado y quieto |
| Siempre | Puntitos de luz van del personaje al farol siguiente (los que ya existen, ahora fijos) |
| Al entrar al sendero | Lumi dice, en español: "Toca el farol que brilla" (una vez por sesión) |
| 6 s sin tocar | El personaje mira al farol y Lumi da una vuelta sobre él |
| 12 s sin tocar, o dos toques al suelo | Una mano toca el farol y se va. Se repite cada 12 s, como máximo tres veces |
| Al volver de una misión | El farol se enciende, las estrellas viajan al contador, el farol siguiente despierta (el poste se abre en disco) y Lumi vuela hasta él. **El personaje no camina solo ni se abre nada solo** |

Se retiran: el menú escrito "¿A dónde vamos primero?", la opción "¿Cómo me muevo?" (la mano lo
muestra) y el diálogo "¿A dónde vamos ahora?" después de cada misión.

### 3.6 Qué se queda y qué sobra

| Hoy | Decisión | Por qué |
| --- | --- | --- |
| Caminar libre con el dedo | **Sale** | Es la causa de "toqué al lado" y de perderse |
| Suelo pintado, árboles, casas, penumbra, cámara, trote, chispas | Se quedan | Son el mundo |
| `rutas.ts` | Se queda | Traza el paso de una parada a otra; ya no hace falta recalcular mientras el dedo se mueve |
| Vecinos | Se quedan como parada junto al farol 1. Grises hasta que su claro se enciende (como hoy) | |
| Encargos | **Se juegan en el sitio.** Al tocar al vecino, él dice la palabra y abajo salen tres tarjetas de 96 px; la correcta vuela hasta él y recupera el color; la equivocada dice su propio nombre, vuelve a su sitio y el vecino repite | Hoy hay que caminar a buscar tres palabras fuera de pantalla y volver siguiendo la brújula |
| Luciérnagas | Se quedan, **se atrapan solas**: máximo dos por sesión, sobre el tramo que el personaje va a caminar, con palabras de `repasar` o del álbum. Dicen su palabra y van al álbum | Sin paseo libre no se pueden buscar; así son repaso que aparece en el mundo |
| Contador "0/10" de luciérnagas y nombre del territorio arriba | **Salen** de la pantalla del mapa. El frasco va al álbum | Dos contadores confunden; el nombre era texto |
| Mini mapa | **Se convierte en el mirador** | Ahora lleva |
| Brújula | **Sale** | Lo que sigue siempre está en pantalla |
| Lumi como personaje quieto en el bosque | Pasa a acompañar: vuela junto al personaje y marca lo que sigue | Es su papel en `CLAUDE.md` |
| Pixie, Cosmo y el pozo | Se quedan en la plaza | |
| Contador "16/17" del puente | Se cambia por una fila de farolitos encendidos y apagados | Sin números |
| Huellas con dibujos | Se quedan como adorno | |
| Flechas del teclado | Izquierda y derecha: parada anterior y siguiente. Enter: abrir. M: mirador | Para el proyector |

### 3.7 Estados

| Estado | Mirador | Sendero |
| --- | --- | --- |
| **Primer día** | Tras la introducción de Pixie y Cosmo se abre solo. Todo en penumbra menos la plaza. El primer lugar pulsa con Lumi. La mano muestra el toque | El personaje aparece junto al farol 1. Voz de Lumi. Los faroles 2 y 3 son postes apagados |
| **Otro día** | No se abre: la app entra directo al sendero del lugar del día | El personaje está donde quedó, junto al farol siguiente |
| **Acierto** (misión terminada) | | Farol encendido (1,6 s), estrellas al contador, despierta el siguiente |
| **Error** (dormido, suelo) | Tocar fuera del mapa: nada | Mecerse, onda gris, Lumi señala. Nunca rojo, nunca zumbido |
| **Sesión del día terminada** (3 misiones) | Los lugares no pulsan. Lumi, dormida, junto al personaje | Los faroles sin encender muestran una luna y no pulsan; al tocarlos, Lumi bosteza y dice que mañana despiertan. Los encendidos, el pozo, el álbum y el vestidor siguen abiertos. Sin bloqueo de pantalla ni cuenta regresiva |
| **Camino completo** | Ese lugar brilla entero; pulsa el siguiente | Fiesta corta (1,2 s), el vecino y su casa recuperan color. El botón del mapa pulsa |
| **Territorio completo** (17 faroles) | El lugar del reloj pulsa y una fila de luz va de la plaza al puente | El puente es la parada siguiente; al tocarlo, la escena del puente abierto |
| **Vacío** (paquete sin `lugares`) | No hay mirador | Se usa el mapa de hoy, para no romper una cartilla vieja |
| **Sin conexión** | Igual: no descarga nada nuevo | Igual |

Cuál es el lugar del día: el que diga el plan de la docente cuando exista; mientras tanto, el
primer lugar, en el orden del paquete, que tenga un farol sin encender.

### 3.8 Tableta y proyector

| Pantalla | Mirador | Sendero |
| --- | --- | --- |
| 390 × 844 | Mapa de 366 px, lugares de 72 px | Escala 0,844; se ven 462 × 1000 px de mundo |
| 768 × 1024 | Mapa de 640 px centrado, lugares de 96 px | Escala 1,02; paradas de 98 a 122 px |
| 1366 × 768 (proyector, horizontal) | Mapa de 640 px a la izquierda; a la derecha, el personaje y Lumi grandes | Escala 1,37; paradas de 110 a 164 px; botones fijos de 76 px. La regla 4 garantiza que dos faroles seguidos quepan en los 562 px de alto |

Hoy, a 768 px, Lumi queda debajo del botón del vestidor; con la zona segura deja de pasar. El mapa
de hoy en proyector está en `09-proyector-1366.webp`.

### 3.9 Movimiento reducido y gama baja

Con `prefers-reduced-motion`:

- El personaje no camina: se desvanece y aparece en la parada nueva (200 ms).
- El aro del farol siguiente no pulsa: es un aro dorado fijo de 6 px. Lumi quieta encima.
- Los puntitos de luz quedan fijos. La burbuja de Lumi y la entrada al sendero son un fundido de 250 ms.
- La mano aparece y desaparece sin moverse. La penumbra se abre de una vez (como hoy).

Gama baja:

- Ya no hay recálculo de ruta mientras el dedo se mueve: la ruta se calcula una vez por tramo y se
  guarda.
- Una sola animación sin fin a la vez (el aro) más el flotar de Lumi.
- El mirador usa la imagen del suelo que ya está descargada; su penumbra son degradados CSS, sin
  lienzo. Peso nuevo de imágenes: 0 KB obligatorios (ver 5.3).
- Se sigue dibujando solo lo cercano a la pantalla. La primera carga no cambia.

### 3.10 Datos nuevos en el paquete de contenido

Todo sale de `herramientas/construir_bosque.py`. No necesita el PNG del suelo: usa la rejilla
`caminable` y las coordenadas que ya están en `cartilla.json`.

```jsonc
// territorios[0].mundo
"lugares": [                       // el orden de la lista es el orden por defecto
  {
    "id": "school",
    "icono": "iconos/1f392.svg",
    "nombre": { "es": "El camino de la escuela", "en": "The school path" },  // se dice, no se muestra
    "mirador": { "x": 22.2, "y": 15.6 },    // % del mapa
    "paradas": ["bosque-school", "caro", "bosque-school-2", "bosque-school-3"]
  }
  // colors, numbers, body, family, time (…"rayo", "puente"), plaza ("pixie", "cosmo", "bosque-pozo")
],
"luciernagasPorSesion": 2           // reemplaza la lista fija de 10 posiciones

// cada misión, cada habitante y la puerta
"pie": { "x": 754, "y": 707 }       // dónde se para el personaje

// habitantes[].encargo: se quitan x, y (ya no hay que ir a buscar las palabras)

// raíz de la cartilla
"sesion": { "misionesPorDia": 3 }
"ayudas": { "mapa-toca-farol": …, "mapa-dormido": …, "mapa-manana": …,
            "mapa-camino-listo": …, "mapa-puente": … }      // frases de 5.2
```

Posiciones de partida para el mirador (% del mapa): plaza 49,5 / 48,5; escuela 22,2 / 15,6;
colores 15,5 / 48,1; números 75,8 / 15,1; cuerpo 24,4 / 78,6; familia 76,5 / 78,7; reloj
74,3 / 44,6.

En `progreso.ts`: `lugar` (dónde quedó) y la cuenta de misiones por día (ya se guarda `dias`).
No se guarda nada nuevo del niño.

### 3.11 Costo y orden de construcción

Mediano. Cuatro tandas, cada una comprobable a 390 px, con un solo desarrollador:

| Tanda | Qué | Archivos |
| --- | --- | --- |
| 1 | Datos: lugares, pies, orden hacia afuera, 5 postes, regla de separación que detiene el guion | `construir_bosque.py`, `tipos.ts`, `cartilla.json` (generado) |
| 2 | Sendero: toque por círculos, moverse entre paradas, cámara que encuadra, señales de 3.5. Se quitan el paseo libre, la brújula y las palabras sueltas del encargo | `Mundo.tsx`, `estilos.css` |
| 3 | Mirador (reemplaza `MiniMapa.tsx`) y entrada del primer día | `Mirador.tsx`, `Mundo.tsx` |
| 4 | Encargo en el sitio, luciérnagas en el tramo, estados de sesión terminada y camino completo | `Mundo.tsx`, `progreso.ts` |

Prueba nueva en `scripts/pruebas/mapa.mjs`, a 360 × 640, 390 × 844, 768 × 1024 y 1366 × 768:
ningún par de zonas de toque se monta ni queda a menos de 12 px; ninguna zona mide menos de 48 px;
desde cada parada, la siguiente está entera en la zona segura; de la portada a la primera misión
hay tres toques (jugar, lugar, farol), sin contar los diálogos.

---

## 4. Variables

Paleta y tipografía no cambian (`docs/diseno/ronda-1.md` §0: Baloo 2, noche, crema, oro, menta
como acento del Bosque). Se agregan a `:root`:

```css
:root {
  /* Paradas: en px de mundo; el mundo se escala entre 0,75 y 2 */
  --parada-siguiente: 96px;
  --parada: 80px;
  --parada-dormida: 52px;
  --aro-siguiente: 6px;          /* aro dorado; pulsa salvo con movimiento reducido */

  /* Mirador: en px de pantalla */
  --mirador-lugar: 72px;         /* 96px desde 768 de ancho */
  --mirador-plaza: 64px;
  --mirador-farolito: 14px;
  --mirador-radio: 28px;

  /* Botones fijos */
  --util: 62px;                  /* 76px desde 1024 de ancho */
  --util-separacion: 12px;

  /* Zona segura de la cámara */
  --seguro-arriba: 76px;
  --seguro-lado: 16px;
  --seguro-utiles: 86px;         /* ancho de la columna de botones */

  /* Movimiento nuevo */
  --d-pulso: 1.6s;
  --d-despertar: 0.6s;
  --d-vuelo: 0.7s;
  --d-encuadre: 0.35s;
}
```

Las distancias de las reglas de 3.4 (150, 110, 340 px de mundo) son constantes del guion que arma
el mapa, no del CSS.

---

## 5. Animaciones, sonidos y recursos

### 5.1 Animaciones

| Animación | Dura | La dispara | Con movimiento reducido |
| --- | --- | --- | --- |
| Aro del farol siguiente | 1,6 s, sin fin | Hay un farol siguiente a la vista | Aro fijo |
| Lumi flota sobre lo que sigue | 2,2 s, sin fin | Siempre | Quieta |
| Disco que se hunde al tocarlo | 120 ms | Toque en una parada o un lugar | Igual |
| Caminar a la parada | Hasta 1,5 s (trote si es lejos) | Toque en una parada | Fundido de 200 ms |
| Poste dormido que se mece | 400 ms | Toque en un farol dormido | Cambia de brillo 200 ms |
| Onda gris | 560 ms (ya existe) | Toque en el suelo | Aparece y se apaga |
| Lumi salta sobre el farol | 500 ms | Toque en el suelo o en un dormido; 6 s sin tocar | Brilla 300 ms |
| Mano que muestra el toque | 1,4 s | 12 s sin tocar; dos toques al suelo; primer día | Aparece 1 s, sin moverse |
| Farol que se enciende | 1,6 s (ya existe) | Volver de una misión terminada | De una vez |
| Farol que despierta (poste a disco) | 600 ms | Termina el encendido del anterior | Fundido de 200 ms |
| Lumi vuela al farol nuevo | 700 ms | Termina de despertar | Aparece allá |
| Burbuja de Lumi sobre el mirador | 700 ms | Toque en un lugar | Fundido de 250 ms |
| Entrar al sendero y salir al mirador | 350 ms | Tras la burbuja; botón del mapa | Fundido de 250 ms |
| Tarjeta del encargo vuela al vecino | 450 ms | Toque en la correcta | Fundido |
| Tarjeta equivocada vuelve a su sitio | 300 ms | Toque en otra | Igual, sin rebote |
| Luciérnaga que se atrapa | 500 ms (ya existe) | El personaje pasa por ella | Destello |
| Fiesta de camino completo | 1,2 s | Tercer farol del camino | Brillo de 400 ms |
| Lumi bosteza y se duerme | 900 ms | Tercera misión del día | Cambia de imagen |

### 5.2 Sonidos y frases

Efectos nuevos (hechos en el navegador como los actuales; 0 KB):

| Nombre | Cómo suena | Cuándo |
| --- | --- | --- |
| `despertar` | Dos notas que suben, 300 ms | Un farol despierta |
| `dormido` | Una nota grave y suave, 200 ms. No es zumbido | Toque en un farol dormido |
| `vuelo` | Soplo que sube, 600 ms | Burbuja de Lumi |
| `nana` | Tres notas que bajan, 900 ms | Sesión del día terminada |

Se reutilizan `toque`, `salto`, `estrella`, `fiesta`, `acierto`, `intenta` y `atrapar`.

Frases nuevas de Lumi, en español, para el guion (`herramientas/generar_voz.py` las graba). El
pedagogo ajusta el texto; ninguna pide volver ni ata el mañana a un premio:

| Clave | Texto propuesto |
| --- | --- |
| `mapa-elige-lugar` | "¿A dónde vamos hoy? Toca un lugar." |
| `mapa-toca-farol` | "Toca el farol que brilla." |
| `mapa-dormido` | "Ese farol todavía duerme. Vamos por el que brilla." |
| `mapa-camino-listo` | "¡Todo este camino brilla!" |
| `mapa-manana` | "Hoy encendimos mucho. Mañana despiertan más faroles." |
| `mapa-puente` | "¡Todos los faroles brillan! Vamos al puente." |
| Nombre de cada lugar (7) | "El camino de la escuela", "El camino de los colores"… |

### 5.3 Recursos gráficos

No falta ninguno para construir: se reutilizan el suelo, `objeto-4.webp` (poste), los iconos de
tema, `objeto-6.webp` (pozo) y `lumi-point.webp`. Opcionales, para el diseñador gráfico:

| Recurso | Para qué | Tamaño final | Mientras tanto |
| --- | --- | --- | --- |
| `personajes/lumi-duerme.webp` | Sesión terminada | 128 × 128 (se muestra a 64) | `lumi-wave.webp` atenuada |
| `mundo/mano.webp` | Mano que muestra el toque | 96 × 96 (se muestra a 48) | El símbolo de mano del sistema |
| `fondos/bosque-mirador-boton.webp` | Botón del mapa con el bosque real | 112 × 112 (se muestra a 56) | El dibujo de mapa actual |
| `mundo/luna.webp` | Faroles que esperan a mañana | 64 × 64 (se muestra a 32) | `iconos/1f319.svg`, que ya existe |

Menos de 30 KB en total, fuera de la primera carga.

---

## 6. Decisiones que debe tomar Manuel

1. **¿El personaje deja de caminar a cualquier parte?** En la propuesta solo va de una parada a
   otra, y el niño siempre tiene a la vista lo que sigue. Es lo que quita el "me perdí" y el "toqué
   otra cosa". A cambio se pierde pasear libre por el bosque. Recomiendo que sí. Si prefieres
   conservar el paseo, la alternativa es el modelo A: se separan los tocables y Lumi guía, pero el
   niño se seguirá perdiendo a veces.
2. **¿Los tres faroles de cada camino quedan en fila, de la plaza hacia afuera?** Hoy el tercero
   está al lado del primero y hay que ir y volver. Cambiaría de sitio el segundo y el tercer farol
   de cada camino. Recomiendo que sí.
3. **¿Los encargos de los vecinos se resuelven ahí mismo?** El vecino pide la palabra y salen tres
   tarjetas para escoger, sin ir a buscarlas por el bosque. Recomiendo que sí.
4. **¿Las luciérnagas se atrapan solas al pasar, dos por día, y su contador se va al álbum?**
   Recomiendo que sí. La alternativa es quitarlas.
5. **¿Los faroles nuevos se duermen ya después de tres misiones en el día?** Es tu decisión
   vigente, pero quien pruebe la app en una sola sentada solo podrá jugar tres. Recomiendo
   construirlo y dejar en la zona de la familia un interruptor "sin límite" para las pruebas.
6. **Mientras no exista el plan de la docente, ¿el lugar del día sigue este orden?** Escuela,
   colores, números, cuerpo, familia, reloj. El niño puede escoger otro.
7. **¿Las frases nuevas de Lumi (sección 5.2) pasan por el pedagogo antes de grabarlas?** Recomiendo
   que sí; son seis frases y siete nombres de lugar.
