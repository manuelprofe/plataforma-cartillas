# Diseño, ronda 2: el mapa del Bosque de los Sonidos

Diseñador. 17 de noviembre de 2026; **actualizado el mismo día** con las decisiones de Manuel
(estaciones por tema, estatua por lugar, juego en casa con el celular de los papás). Responde al
informe de Manuel tras las pruebas con conocidos: (1) los tocables del mapa quedan pegados y se toca
lo que no era; (2) el niño se pierde y no sabe qué sigue. Parte de `CLAUDE.md`, `CONTINUAR.md`,
`docs/referencias/juegos.md` y del mapa real, medido en un navegador a 390 × 844 (también
768 × 1024 y 1366 × 768). Fase: diseñar; no hay código nuevo. Las capturas están en
`docs/diseno/ronda-2/`. Las §1 y §2 son el diagnóstico y no cambian; lo que se construye es §3 a §8.

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

Lo que se pierde es caminar a cualquier parte. Manuel aprobó C (ver §6).

---

## 3. Modelo aprobado: Mirador y estaciones

Manuel aprobó C y las 7 preguntas de la versión anterior (ver §6), con dos cambios que esta
sección ya incorpora: **una estación por tema** en vez de un farol suelto por ejercicio, y **una
estatua por lugar** que cuenta algo breve. También se ajusta a que el niño **juega en casa con el
celular de los papás** (§3.9).

Vocabulario para construir:

| Palabra | Qué es |
| --- | --- |
| **Lugar** | Un tema del territorio, o la plaza. Siete en el Bosque |
| **Claro** | Lo que se ve de un lugar: el mundo de hoy encuadrado fijo, con todas sus paradas en una pantalla |
| **Parada** | Algo que se toca en el claro: estación, vecino, estatua, pozo, Pixie, Cosmo, puente |
| **Estación** | El farol del tema. Reúne sus ejercicios (misiones) y muestra una **luz** por cada uno |
| **Bandeja** | Panel que sube desde abajo con los ejercicios de la estación |
| **Mirador** | El bosque entero, para escoger lugar |
| **Pie** | Dónde se para el personaje junto a una parada |

### 3.1 Lugares, estaciones y luces

| Lugar | Paradas | Estación (luces) | Dibujo en el mirador |
| --- | --- | --- | --- |
| Plaza | Pixie, Cosmo, pozo (Memory), estatua | No tiene | El pozo |
| Escuela, colores, números, cuerpo, familia | Estación, vecino, estatua | 3 luces: `-1` escucha y toca, `-2` escucha y atrapa, `-3` di y brilla | Icono del tema |
| Reloj | Estación, Rayo, estatua y, al final, el puente | 2 luces: `bosque-time`, `bosque-time-2` | El reloj |

- **Cada misión sigue encendiendo su luz**, ahora en su estación. Cinco estaciones de 3 y una de 2:
  **17 luces**, las mismas 17 que abren el puente. Las luces se guardan como hoy (misiones encendidas).
- **El Memory del pozo no es luz ni estación.** Sigue en la plaza como repaso libre: no cuenta para
  el puente ni para el límite del día, y no se duerme nunca.
- **La estación ocupa el sitio del farol 1 de hoy** (claro cercano a la plaza; el vecino ya está
  ahí). Los faroles 2 y 3 de cada camino desaparecen como sitio: **no hay que caminar por el
  camino.** Reloj: la estación va entre los dos faroles de hoy (≈ 1965, 1223).
- **Postes:** cada estación usa un poste `objeto-4.webp` (hay 12 pintados, se necesitan 6). Los 6
  que sobran se quitan del mapa: un poste apagado sin estación parece un tocable.
- **El avance se ve en el mundo:** la penumbra alrededor de la estación se abre un tercio por cada
  luz (con 2 luces, la mitad por cada una); con la estación completa, el claro entero y la casa del
  vecino recuperan el color.

### 3.2 La estación, vista y tocada

Boceto con el mapa real a 390 × 844 (reducido a 300 px de ancho), con la bandeja abierta:
`ronda-2/10-boceto-estacion.webp`.

```
┌──────────────────────────────────────┐
│ (★ 15)                               │
│                ●  ○  ○               │  luces de la estación: una por ejercicio,
│        yo   ((MOCHILA))              │  arco sobre el disco. ● hecha (oro), ○ por hacer
│                                      │  disco de la estación con el icono del tema
│                         ┌────┐       │
│   (Caro)                │ )) │       │  estatua: piedra con insignia de altavoz
│                         │est.│       │  (en el boceto, tarjeta gris como marcador)
│                         └────┘       │
├──────────────────────────────────────┤
│                 Lumi            (X)  │  bandeja: 30 % del alto (192 a 260 px)
│        ●          ○          ○       │  la misma luz sobre cada ejercicio
│     (OÍDO)    ((MANOS))    (boca)    │  hecho 80 px · siguiente 96 px con aro · pendiente 80 px gris
└──────────────────────────────────────┘
```

**Cómo se ve sin texto**

| Elemento | Visible (px de mundo) | En pantalla a 390 | Notas |
| --- | --- | --- | --- |
| Disco de la estación | 96 | 81 (toque 101) | Icono del tema, borde crema. Aro dorado que pulsa si tiene un ejercicio por hacer hoy |
| Luces de la estación | 20 cada una, 12 de separación, en arco 18 px sobre el disco | 17 | **Tantas como ejercicios.** Hecha: oro con halo. Por hacer: azul noche con borde crema. No se tocan |
| Poste (`objeto-4`) | 52 × 96, detrás del disco | 44 × 81 | Apagado, encendido a medias, encendido según las luces |

- La cantidad de ejercicios se ve contando luces, no leyendo. Se repite en la bandeja (una luz
  sobre cada disco) y en el mirador (farolitos de 14 px del lugar).
- Estación completa: el disco pasa a borde dorado, deja de pulsar y el poste queda encendido.

**La bandeja**

| Elemento | Medida a 390 | Qué muestra |
| --- | --- | --- |
| Panel | Ancho completo, 30 % del alto (mín. 192, máx. 260), crema, esquinas de arriba 28 px | Sube en 250 ms; el claro sigue visible arriba |
| Disco de ejercicio | Hecho y pendiente 80 px; siguiente 96 px con aro de 6 px | **Icono del tipo de juego**, no del contenido: oído = escucha y toca, manos = escucha y atrapa, boca = di y brilla (iconos `1f442`, `1f64c`, `1f444`, ya están). Orden de izquierda a derecha = orden de las misiones |
| Luz sobre cada disco | 14 px | Igual que en la estación |
| Lumi | 56 px, flota sobre el siguiente | Señala qué toca |
| Cerrar | 56 px, arriba a la derecha, a 24 px del disco más cercano | Círculo noche con X crema |

Separación entre discos: 24 px. Con 2 ejercicios (reloj) quedan centrados.

**Qué pasa al tocar**

| Al tocar | Pasa |
| --- | --- |
| La estación (bandeja cerrada) | Se hunde (120 ms), el personaje camina a su pie (1 s como máximo), sube la bandeja. Sonido `bandeja` |
| El disco **siguiente** | Se hunde, la bandeja baja (200 ms) y se abre la misión como hoy (diálogo de entrada y juego) |
| Un disco **hecho** | Lo mismo: se repite. La luz ya está encendida y no cambia. **No cuenta para el límite del día.** Estrellas: la regla vigente del motor, este diseño no la cambia |
| Un disco **pendiente** | Se mece (400 ms), nota `dormido`, Lumi salta sobre el siguiente. La primera vez en la vida del niño, voz `mapa-pendiente` |
| Cerrar, el claro sobre la bandeja o el botón atrás del celular | Baja la bandeja. Si el toque fue sobre otra parada, además se abre esa parada |
| Una parada del claro con la bandeja abierta | Baja la bandeja y se abre la parada (un toque, no dos) |

**Ejercicios en orden dentro de la estación:** el 2 se abre cuando el 1 está hecho, y el 3 cuando
el 2. Así se respeta "escuchar antes de decir". Entre estaciones no hay orden: todas abiertas.

**Al volver de una misión terminada (luz nueva):** se cierra la misión, el claro aparece con la
bandeja **cerrada**; la luz vuela del disco al arco de la estación y se enciende (1,6 s), la
penumbra se abre, las estrellas viajan al contador. Luego, si queda ejercicio y hay cupo hoy, la
bandeja sube sola con el siguiente pulsando. Nada se abre solo más allá de eso.

**Al volver de una repetición o de un abandono:** el claro con la bandeja abierta, igual que antes.

### 3.3 Mirador a 390 px

Boceto con el mapa real: `ronda-2/11-boceto-mirador.webp`.

```
┌──────────────────────────────────────┐
│ (★ 15)                               │  estrellas: igual que hoy
│ ┌──────────────────────────────────┐ │
│ │  Lumi                            │ │  mapa pintado completo, 366 × 366,
│ │ ((MOCHILA))            ( 3 )     │ │  borde crema 5 px, esquinas 28 px
│ │   ● ○ ○                ○ ○ ○     │ │  lugar: disco de 72 px; plaza: 64 px
│ │ (COLOR)    yo·(POZO)   (RELOJ)   │ │  ● ○ = luces de la estación del lugar
│ │  ○ ○ ○                  ○ ○      │ │       (14 px, no se tocan, sin números)
│ │   (OJOS)               (MANO)    │ │  (( )) = lugar del día: aro que pulsa
│ │    ○ ○ ○                ○ ○ ○    │ │          y Lumi encima
│ └──────────────────────────────────┘ │
│               ( yo )                 │  volver al claro donde estaba, 76 px
└──────────────────────────────────────┘
```

- Siete tocables. Distancia mínima entre centros medida sobre el mapa: 92 px (plaza y reloj), que
  deja 24 px libres; el resto, 108 px o más.
- Cada lugar está en penumbra hasta su primera luz, y se aclara con cada una.
- Tocar un lugar: el disco se hunde (120 ms), Lumi lleva al personaje en una burbuja de luz sobre
  el mapa (700 ms) y entra al claro (350 ms). Voz: el nombre del lugar.
- Todos los lugares abiertos desde el primer día. Solo uno pulsa: el lugar del día.
- El mirador reemplaza al mini mapa y al menú escrito de Cosmo. Se abre con el botón del mapa.

### 3.4 El claro a 390 px

Es el mundo de hoy (suelo, árboles, casas, animales, penumbra) con la **cámara fija** sobre el
lugar: todas sus paradas caben en una pantalla, así que no hay recorrido ni encuadre que seguir. El
personaje solo camina de una parada a otra del mismo claro (1 s como máximo).

Botones fijos (bandeja cerrada): estrellas arriba a la izquierda; abajo a la derecha, en columna,
vestidor, álbum y mapa (62 px, separados 12). Con la bandeja abierta, los botones se ocultan.

| Al tocar | Pasa |
| --- | --- |
| La estación | 3.2 |
| El vecino | Camina y se abre su encargo en el sitio (tres tarjetas, como ya se aprobó). Gris hasta la primera luz de su estación |
| La estatua | 3.5. El personaje no camina: se gira hacia ella |
| Pixie, Cosmo (plaza) | Su diálogo de hoy |
| El pozo (plaza) | Memory, como hoy |
| El suelo, un árbol, una huella | Onda gris y Lumi da un saltito sobre lo que sigue. **El personaje no camina.** Al segundo toque al suelo en 5 s, la mano muestra dónde tocar |
| El botón del mapa | Abre el mirador |

**Qué llama la atención** (solo una cosa a la vez, en este orden):

1. La estación, si tiene ejercicio por hacer y hay cupo hoy (aro que pulsa, Lumi encima).
2. Si no, el vecino con encargo pendiente (el globo "!" pulsa).
3. Si no, el botón del mapa, si otro lugar tiene luces por encender y hay cupo hoy.
4. Si no hay cupo hoy: nada pulsa (3.7).

La estatua **nunca pulsa**: es para curiosear, no para avanzar.

Señales de ayuda, de la más silenciosa a la más clara:

| Cuándo | Qué se ve y se oye |
| --- | --- |
| Al entrar a un claro con la bandeja abierta | Lumi dice `mapa-toca-luz` (una vez por sesión) |
| 6 s sin tocar | El personaje mira lo que llama la atención y Lumi da una vuelta sobre ello |
| 12 s sin tocar, o dos toques al suelo | La mano toca lo que llama la atención y se va. Cada 12 s, máximo tres veces |

### 3.5 La estatua de cada lugar

Una estatua de piedra por lugar (7). Al tocarla cuenta algo breve: voz primero, texto debajo.

**Posición, tamaño y toque**

| | Valor |
| --- | --- |
| Sitio | En el claro, al lado del camino que lleva a la plaza, **en la mitad de arriba del encuadre** (para que se pueda tocar con la bandeja abierta) |
| Distancias | 150 px de mundo o más a cualquier otra parada (regla 2 de 3.6); fuera de la zona de los botones fijos |
| Visible | 72 × 96 px de mundo (61 × 81 a 390; 82 × 110 en tableta; 99 × 132 en proyector) |
| Zona de toque | Círculo de 50 px de mundo de radio (84 px a 390), centrado en el cuerpo de la estatua |
| Rango para choques | Igual que pozo y puente |
| Aspecto | Pedestal de piedra con el **objeto del tema tallado** (mochila, pincel, números, mano, familia, reloj; en la plaza, una estrella). Insignia de altavoz de 24 px dorada en la esquina de arriba: dice "esto habla" sin texto |
| Con la estación completa | Un brillo dorado en el borde de la piedra (el mundo responde). Sin pulso |

**Qué pasa al tocarla**

| Momento | Qué se ve y se oye | Dura |
| --- | --- | --- |
| Toque | La estatua se hunde, nota `estatua`, el personaje se gira hacia ella | 120 ms |
| Abre | Velo noche al 40 % sobre el claro; la tarjeta crece desde la estatua hasta el centro | 250 ms |
| Tarjeta (390 px) | 330 × 400 px, crema, esquinas 28 px. Arriba, la estatua grande (200 × 200). Debajo, el texto en español (24 px, máximo dos líneas). Si hay palabra en inglés, va en su propia línea, 28 px, en menta. Abajo al centro, altavoz de 64 px | |
| Voz | **Empieza sola** al abrir: Lumi lee la frase en español y, si hay, la voz inglesa dice la palabra. Lumi aparece en la esquina de la tarjeta, 56 px, moviéndose mientras habla | 8 s como máximo en total |
| Volver a oír | Altavoz: repite todo | |
| Cierre | X de 56 px arriba a la derecha, toque fuera de la tarjeta o botón atrás. **No se cierra sola** | 200 ms |

- No da estrellas ni enciende luces. Siempre abierta, también con la sesión terminada.
- La primera vez que el niño cierra la bandeja en cualquier claro, Lumi dice `mapa-estatuas` una
  sola vez en todo el juego. Después, nadie la anuncia.
- Si el audio no se oye (celular en silencio), el texto está ahí para el adulto que acompañe.

### 3.6 Tamaños, separación y regla para los choques

Los tocables del mundo crecen con la escala (0,75 en un celular de 360 × 640; 0,844 a 390 × 844;
1,02 en tableta; 1,37 en proyector). Se fijan en píxeles de mundo:

| Parada | Visible (mundo) | Radio de toque (mundo) | A 360 px | A 390 px |
| --- | --- | --- | --- | --- |
| Estación con ejercicio por hacer | 96 | 60 | 72 visible, 90 de toque | 81 y 101 |
| Estación completa, vecino, Pixie, Cosmo, pozo, puente | 80 | 50 | 60 y 75 | 68 y 84 |
| Estatua | 72 × 96 | 50 | 54 × 72 y 75 | 61 × 81 y 84 |

Reglas, en este orden:

1. **La zona de toque es un círculo.** Una sola función decide: gana la parada cuyo borde esté más
   cerca del dedo, si el dedo cae dentro de su radio más 12 px de tolerancia.
2. **Dos paradas nunca a menos de 150 px de mundo entre centros** (127 px en pantalla a 390).
3. **El pie del personaje** va a un lado de su parada (75 px al lado, 35 abajo), del lado con más
   espacio, y a 110 px o más de cualquier otra parada.
4. **Todas las paradas de un lugar caben en un cuadro de 340 × 480 px de mundo** (el puente se
   exceptúa, ver 3.7). Es lo que deja ver el claro entero a 360 × 640 con la bandeja abierta.
5. **Si dos cosas chocan, se mueve la de menor rango:** estación > vecino > estatua, pozo, Pixie,
   Cosmo y puente > adornos. Se corre en pasos de 20 px, alejándose de la plaza, hasta cumplir 2.
   En la plaza, hoy Cosmo y el pozo están a 130 px: se mueve el pozo.
6. **Los animales** no vuelan a menos de 90 px de una parada. **Las huellas** quedan como adorno
   sin borde punteado.
7. **Zona de los botones fijos:** rectángulo abajo a la derecha de 86 × 232 px de pantalla (76 px
   de botón desde 1024 de ancho: 100 × 272). Ninguna parada debajo. La franja de arriba (76 px)
   tampoco.
8. **El guion que arma el mapa se detiene con un mensaje si una regla no se cumple.**

### 3.7 Estados

| Estado | Mirador | Claro |
| --- | --- | --- |
| **Primer día** | Tras la introducción de Pixie y Cosmo se abre solo. Todo en penumbra menos la plaza. Pulsa la escuela con Lumi; la mano muestra el toque | Personaje junto a la estación; bandeja abierta con el ejercicio 1 pulsando y los otros dos grises |
| **Otro día** | No se abre: la app entra directo al claro del lugar del día | Bandeja abierta si la estación tiene algo por hacer; si no, cerrada y pulsa lo que siga (3.4) |
| **Acierto** (luz nueva) | | La luz vuela a la estación, se enciende, se abre la penumbra, estrellas al contador, la bandeja vuelve a subir (3.2) |
| **Error** (pendiente, suelo) | Tocar fuera del mapa: nada | Mecerse, onda gris, Lumi señala. Nunca rojo, nunca zumbido |
| **Estación completa** | Las luces del lugar brillan todas; pulsa otro lugar | Fiesta corta (1,2 s), el vecino y su casa recuperan color, brillo en la estatua. La bandeja no sube. Pulsa lo que siga |
| **Sesión del día terminada** (3 luces nuevas hoy) | Los lugares no pulsan. Lumi dormida junto al personaje | Los discos pendientes muestran una luna de 32 px y no pulsan; al tocarlos, Lumi bosteza y dice `mapa-manana`. Discos hechos, estatua, pozo, vecinos con encargo, álbum y vestidor siguen abiertos. Sin bloqueo ni cuenta regresiva |
| **Territorio completo** (17 luces) | Una fila de luz va de la plaza al reloj; el reloj pulsa | En el claro del reloj, el puente pasa a ser lo que llama la atención: la cámara se corre (700 ms) hasta encuadrar personaje y puente, Lumi dice `mapa-puente`; al tocarlo, el personaje trota (2 s como máximo) y se abre la escena del puente abierto |
| **Puente antes de completar** | | Fuera del encuadre del reloj. Si el niño llega a él (proyector, teclado), muestra **seis grupos de farolitos**, uno por estación (3, 3, 3, 3, 3 y 2), encendidos o apagados. Sin números |
| **Vacío** (paquete sin `lugares`) | No hay mirador | Se usa el mapa de hoy, para no romper una cartilla vieja |
| **Sin conexión** | Igual | Igual. La estatua usa audio ya descargado con el lugar; si faltara, se ve el texto y el altavoz queda atenuado |

El límite cuenta **luces nuevas**: repeticiones, Memory, encargos y estatuas no gastan cupo.
Con 3 luces al día, una sesión típica es **una estación completa** (3 ejercicios, 10 a 15
minutos). El reloj tiene 2: ese día la tercera puede ser de cualquier otra estación.

Cuál es el lugar del día: el que diga el plan de la docente cuando exista; mientras tanto, el
primero, en este orden, con luces por encender: escuela, colores, números, cuerpo, familia, reloj.

### 3.8 Qué se simplifica de la versión anterior

| Antes (farol por ejercicio) | Ahora |
| --- | --- |
| Sendero de 3 faroles por camino, en fila hacia afuera, y cámara que encuadra personaje y farol siguiente | Un claro por lugar con cámara fija. Sin recorrido |
| 17 faroles + 5 postes nuevos | 6 estaciones con 6 postes existentes; se quitan 6 postes |
| Faroles dormidos de 52 px en el mundo | No existen: lo pendiente vive en la bandeja |
| Regla "dos faroles seguidos caben en 340 × 340" | Regla 4: el lugar entero cabe en 340 × 480 |
| Teclado: izquierda y derecha entre paradas del sendero | Izquierda y derecha entre paradas del claro; en la bandeja, entre discos. Enter abre, Escape cierra, M mirador |
| Luciérnagas sobre el tramo que se camina | Al volver de las misiones 1 y 2 del día, una luciérnaga baja hasta el personaje y se atrapa sola (500 ms), dice su palabra y va al álbum. Máximo dos por día |
| Contador "16/17" del puente | Seis grupos de farolitos |

Se mantiene de la versión aprobada: encargos en el sitio, mirador, el niño no camina libre, sin
brújula ni mini mapa, sin el menú escrito de Cosmo, sin contador de luciérnagas en el mapa, Lumi
acompaña.

### 3.9 Jugar en casa con el celular de los papás

Decisión del 17 de noviembre: los niños no tienen celular; practican en casa con el de los papás.
En el salón solo hay proyector.

| Situación | Diseño |
| --- | --- |
| **Sesión corta, a veces cortada** | 3 luces al día ≈ una estación. Si la app pasa al fondo (llamada, el papá pide el celular), se pausan voz y juego. Al volver antes de 10 min: sigue en el mismo paso, Lumi dice `mapa-seguimos`. Después de 10 min: el claro con la bandeja abierta; la misión sin terminar no enciende luz y no se pierde nada de lo ganado |
| **Botón atrás de Android** | Cierra lo que esté encima, en orden: tarjeta de estatua, bandeja, mirador. En el claro no sale de la app: no hace nada. Salir de una misión sigue siendo el botón de salir de cada juego |
| **Celular compartido entre hermanos** | El claro muestra solo el personaje (héroe) del niño activo, nunca el apodo escrito. Escoger quién juega va en la entrada, antes del mapa (tarea 4 del diseñador). Cambiar de niño y "empezar de nuevo" viven en la zona de la familia |
| **Un adulto cerca, a veces** | Todo funciona con voz; el texto en español de estatuas y tarjetas está para que el adulto lo lea con el niño. El resumen para la familia (`mision.familia`, ya existe) se consulta en la zona de la familia, no en el mapa |
| **Celular en silencio o volumen bajo** | Lumi se mueve cuando habla, así el niño ve que hay voz. La primera frase de la sesión espera al primer toque del niño (el navegador lo exige) |
| **Plan de datos de la familia** | El audio de cada estatua (≈ 15 KB) y los ejercicios se descargan con su lugar, no en la primera carga. Nada nuevo pesa en la primera carga |
| **Celular de gama baja, 360 × 640** | Es la medida mínima de todas las pruebas. Cámara fija: menos dibujo que hoy |
| **Celular horizontal** | Si el alto es menor de 480 px, la bandeja pasa a una columna a la derecha de 128 px, discos en vertical. El claro se encuadra en el resto |
| **Sin notificaciones** | La app no avisa, no cuenta días seguidos ni pide volver |

### 3.10 Tableta y proyector

| Pantalla | Mirador | Claro y bandeja |
| --- | --- | --- |
| 390 × 844 | Mapa de 366 px, lugares de 72 px | Escala 0,844; bandeja 253 px; discos 80 y 96 |
| 768 × 1024 | Mapa de 640 px centrado, lugares de 96 px | Escala 1,02; bandeja 260 px, discos 96 y 112 |
| 1366 × 768 (proyector) | Mapa de 640 px a la izquierda; a la derecha, el personaje y Lumi grandes | Escala 1,37; la bandeja es una columna a la derecha de 200 px con discos de 112 y 128; botones fijos de 76 px. Estatua: tarjeta de 480 × 560 |

### 3.11 Movimiento reducido y gama baja

Con `prefers-reduced-motion`:

- El personaje no camina: se desvanece y aparece en la parada nueva (200 ms).
- El aro de la estación y del disco siguiente es fijo. Lumi quieta.
- Bandeja, tarjeta de estatua, burbuja y entrada al claro: fundidos de 200 a 250 ms.
- La luz que vuela a la estación aparece encendida. La mano aparece y desaparece sin moverse.

Gama baja: cámara fija por lugar (sin seguir al personaje); una sola animación sin fin a la vez
más el flotar de Lumi; penumbra del mirador con degradados CSS; se sigue dibujando solo lo
cercano a la pantalla.

### 3.12 Datos nuevos en el paquete de contenido

Todo sale de `herramientas/construir_bosque.py`, con la rejilla `caminable` y las coordenadas de
`cartilla.json`. Ningún texto queda dentro del código.

```jsonc
// territorios[0].mundo
"lugares": [                                   // el orden es el orden por defecto
  {
    "id": "school",
    "icono": "iconos/1f392.svg",
    "nombre": { "es": "…" },                   // lo escribe el pedagogo; se dice, no se muestra
    "mirador": { "x": 22.2, "y": 15.6 },       // % del mapa
    "encuadre": { "x": 700, "y": 520, "ancho": 340, "alto": 480 },   // mundo; regla 4
    "estacion": {
      "x": 829, "y": 672, "pie": { "x": 754, "y": 707 },
      "misiones": ["bosque-school", "bosque-school-2", "bosque-school-3"]  // orden de la bandeja
    },
    "estatua": {
      "x": 0, "y": 0,                          // los calcula el guion (3.5, 3.6)
      "imagen": "mundo/estatua.webp",          // pedestal común
      "talla": "iconos/1f392.svg",             // objeto tallado (icono en piedra por CSS)
      "texto": { "es": "…" },                  // lo escribe el pedagogo
      "palabra": "backpack"                    // opcional; voz inglesa
    },
    "paradas": ["caro"]                        // vecino, Pixie, Cosmo, pozo, puente: con x, y, pie
  }
  // colors, numbers, body, family, time (estacion con 2 misiones; paradas rayo y puente), plaza (sin estacion)
],
"iconosJuego": {                               // icono de los discos de la bandeja
  "escucha-toca": "iconos/1f442.svg", "escucha-atrapa": "iconos/1f64c.svg",
  "di-brilla": "iconos/1f444.svg", "memoria": "iconos/1f440.svg"
},
"luciernagasPorSesion": 2

// misiones[]: se quitan x, y (la posición es la de su estación)
// habitantes[].encargo: se quitan x, y
// raíz: "sesion": { "misionesPorDia": 3, "pausaMinutos": 10 }
// raíz: "ayudas": las claves de §7.1
```

La voz de `texto.es` y de `palabra` se genera como el resto (`voz.es` y `voz.en`).

Posiciones de partida para el mirador (% del mapa): plaza 49,5 / 48,5; escuela 22,2 / 15,6;
colores 15,5 / 48,1; números 75,8 / 15,1; cuerpo 24,4 / 78,6; familia 76,5 / 78,7; reloj
74,3 / 44,6.

En `progreso.ts`: `lugar` (dónde quedó) y las luces nuevas de hoy (ya se guarda `dias`). No se
guarda nada nuevo del niño. Tocar una estatua no se guarda (salvo la marca de "ya se dijo
`mapa-estatuas`").

---

## 4. Variables

Paleta y tipografía no cambian (`docs/diseno/ronda-1.md` §0: Baloo 2, noche, crema, oro, menta
como acento del Bosque). Se agregan a `:root`:

```css
:root {
  /* Paradas: en px de mundo; el mundo se escala entre 0,75 y 2 */
  --parada-siguiente: 96px;      /* estación con algo por hacer */
  --parada: 80px;
  --estatua-ancho: 72px;
  --estatua-alto: 96px;
  --luz-estacion: 20px;
  --luz-separacion: 12px;
  --aro-siguiente: 6px;          /* pulsa salvo con movimiento reducido */

  /* Bandeja: en px de pantalla */
  --bandeja-alto: clamp(192px, 30vh, 260px);
  --disco: 80px;                 /* 96px desde 768 de ancho; 112px en proyector */
  --disco-siguiente: 96px;       /* 112px desde 768; 128px en proyector */
  --disco-separacion: 24px;
  --disco-luz: 14px;
  --cerrar: 56px;

  /* Tarjeta de estatua */
  --tarjeta-ancho: min(330px, 86vw);   /* 480px en proyector */
  --tarjeta-imagen: 200px;
  --velo: rgb(23 10 54 / 0.4);   /* --noche-honda al 40 % */

  /* Mirador */
  --mirador-lugar: 72px;         /* 96px desde 768 de ancho */
  --mirador-plaza: 64px;
  --mirador-farolito: 14px;
  --mirador-radio: 28px;

  /* Botones fijos y zona segura */
  --util: 62px;                  /* 76px desde 1024 de ancho */
  --util-separacion: 12px;
  --seguro-arriba: 76px;
  --seguro-lado: 16px;
  --seguro-utiles-ancho: 86px;
  --seguro-utiles-alto: 232px;

  /* Movimiento */
  --d-pulso: 1.6s;
  --d-hundir: 120ms;
  --d-bandeja: 250ms;
  --d-tarjeta: 250ms;
  --d-vuelo: 0.7s;
  --d-entrar: 0.35s;
}
```

Las distancias de 3.6 (150, 110, 340 × 480 px de mundo) son constantes del guion, no del CSS.

---

## 5. Animaciones, sonidos y recursos

### 5.1 Animaciones

| Animación | Dura | La dispara | Con movimiento reducido |
| --- | --- | --- | --- |
| Aro de la estación o del disco siguiente | 1,6 s, sin fin | Hay algo por hacer con cupo | Aro fijo |
| Lumi flota sobre lo que sigue | 2,2 s, sin fin | Siempre | Quieta |
| Disco o parada que se hunde | 120 ms | Cualquier toque en un tocable | Igual |
| Caminar a una parada del claro | Hasta 1 s | Toque en estación, vecino, pozo, Pixie, Cosmo | Fundido de 200 ms |
| Bandeja sube / baja | 250 / 200 ms | Toque en la estación; entrar a un claro con algo por hacer; cerrar | Fundido |
| Disco pendiente se mece | 400 ms | Toque en un pendiente | Cambia de brillo 200 ms |
| Onda gris | 560 ms (ya existe) | Toque en el suelo | Aparece y se apaga |
| Lumi salta sobre lo que sigue | 500 ms | Toque en el suelo o en un pendiente; 6 s sin tocar | Brilla 300 ms |
| Mano que muestra el toque | 1,4 s | 12 s sin tocar; dos toques al suelo; primer día | Aparece 1 s, sin moverse |
| La luz vuela del disco a la estación y se enciende | 600 + 1000 ms | Volver de una misión con luz nueva | Aparece encendida |
| Penumbra se abre un tramo | 800 ms | Termina de encenderse la luz | De una vez |
| Tarjeta de estatua abre / cierra | 250 / 200 ms | Toque en la estatua / cerrar | Fundido |
| Lumi habla en la tarjeta | Lo que dure la voz | Voz de la estatua | Quieta |
| Burbuja de Lumi sobre el mirador | 700 ms | Toque en un lugar | Fundido de 250 ms |
| Entrar al claro y salir al mirador | 350 ms | Tras la burbuja; botón del mapa | Fundido de 250 ms |
| Cámara hacia el puente | 700 ms | Territorio completo, en el claro del reloj | Corte con fundido |
| Tarjeta del encargo vuela al vecino | 450 ms | Toque en la correcta | Fundido |
| Tarjeta equivocada vuelve a su sitio | 300 ms | Toque en otra | Igual, sin rebote |
| Luciérnaga baja y se atrapa | 500 ms (ya existe) | Volver de las misiones 1 y 2 del día | Destello |
| Fiesta de estación completa | 1,2 s | Última luz de la estación | Brillo de 400 ms |
| Lumi bosteza y se duerme | 900 ms | Tercera luz nueva del día | Cambia de imagen |

### 5.2 Sonidos

Efectos nuevos, hechos en el navegador como los actuales (0 KB):

| Nombre | Cómo suena | Cuándo |
| --- | --- | --- |
| `bandeja` | Soplo suave que sube, 250 ms | Sube la bandeja |
| `luz` | Dos notas que suben, 300 ms | Una luz se enciende en la estación |
| `dormido` | Una nota grave y suave, 200 ms. No es zumbido | Toque en un disco pendiente o con luna |
| `estatua` | Campanita de piedra, 300 ms | Toque en la estatua |
| `vuelo` | Soplo que sube, 600 ms | Burbuja de Lumi |
| `nana` | Tres notas que bajan, 900 ms | Sesión del día terminada |

Se reutilizan `toque`, `salto`, `estrella`, `fiesta`, `acierto`, `intenta` y `atrapar`.
Voces nuevas: las de §7, grabadas con `herramientas/generar_voz.py` (Kokoro, sin cambios).

### 5.3 Recursos gráficos

Para construir solo falta uno; lo demás se reutiliza (suelo, `objeto-4.webp`, iconos de tema y de
juego, `objeto-6.webp`, `lumi-point.webp`).

| Recurso | Para qué | Tamaño final | Mientras tanto | ¿Bloquea? |
| --- | --- | --- | --- | --- |
| `mundo/estatua.webp` | Pedestal de piedra con hueco al frente para el objeto tallado; mismo estilo pintado que `objeto-*` | 288 × 384 (se muestra hasta 99 × 132 en el mundo y a 200 en la tarjeta) | Rectángulo de piedra en CSS con el icono en gris; es lo que muestra el boceto | No |
| `personajes/lumi-duerme.webp` | Sesión terminada | 128 × 128 (se muestra a 64) | `lumi-wave.webp` atenuada | No |
| `mundo/mano.webp` | Mano que muestra el toque | 96 × 96 (se muestra a 48) | Símbolo de mano del sistema | No |
| `fondos/bosque-mirador-boton.webp` | Botón del mapa con el bosque real | 112 × 112 (se muestra a 56) | El dibujo de mapa actual | No |
| `mundo/luna.webp` | Discos que esperan a mañana | 64 × 64 (se muestra a 32) | `iconos/1f319.svg` | No |

Menos de 50 KB en total, fuera de la primera carga. El objeto tallado se logra con el icono del
tema y un filtro CSS (gris, relieve con sombra interior): no hacen falta siete esculturas.

---

## 6. Decisiones

**Tomadas por Manuel (17 nov):** sí a las 7 preguntas de la versión anterior (paradas en vez de
caminar libre; orden fijo dentro del tema; encargos en el sitio; luciérnagas automáticas, dos por
día, contador al álbum; límite de 3 al día con interruptor "sin límite" en la zona de la familia;
orden escuela, colores, números, cuerpo, familia, reloj; frases por el pedagogo), más estaciones,
estatuas y juego en casa con el celular de los papás.

**Abiertas, con recomendación (se construye así si Manuel no dice otra cosa):**

1. **La bandeja se abre sola al entrar al claro** si hay algo por hacer. Ahorra un toque (de la
   portada a la primera misión: jugar, lugar, ejercicio). La alternativa es tocar primero la
   estación. Recomiendo que se abra sola.
2. **Repetir un ejercicio hecho no gasta cupo del día.** Recomiendo que sí: repetir es práctica.
3. **Una estatua común con el objeto del tema tallado**, no siete esculturas distintas. Más
   adelante el diseñador gráfico puede hacer siete.
4. **Los 6 postes que sobran se quitan del mapa.** Recomiendo que sí.

---

## 7. Encargo para el pedagogo

Textos en español, de tú, cálidos, sin "muy bien", "mal", "rápido" ni comparaciones. Ninguna frase
pide volver, ata el mañana a un premio ni habla de notas. Se entienden sin haber leído nada antes
(preescolar). Las cuentas de duración son con la voz de Kokoro a velocidad normal.

### 7.1 Frases de Lumi (`ayudas`)

| Clave | Cuándo suena | Límite | Propuesta de partida |
| --- | --- | --- | --- |
| `mapa-elige-lugar` | Mirador, primer día y cuando no hay lugar del día | 8 palabras, 3 s | "¿A dónde vamos hoy? Toca un lugar." |
| `mapa-toca-luz` | Al entrar a un claro con la bandeja abierta (una vez por sesión) | 6 palabras, 2 s | "Toca el que brilla." |
| `mapa-pendiente` | Primera vez que toca un disco pendiente | 10 palabras, 3 s | "Ese viene después. Primero el que brilla." |
| `mapa-estacion-lista` | Estación completa | 6 palabras, 2 s | "¡Esta estación brilla entera!" |
| `mapa-estatuas` | Una sola vez en el juego | 10 palabras, 3 s | "Las estatuas hablan. Tócalas cuando quieras." |
| `mapa-manana` | Tocar un disco con luna; tercera luz del día | 12 palabras, 4 s | "Hoy encendimos mucho. Mañana despiertan más luces." |
| `mapa-seguimos` | Volver a la app antes de 10 min | 4 palabras, 2 s | "¡Seguimos!" |
| `mapa-puente` | Las 17 luces encendidas | 10 palabras, 3 s | "¡Todas las luces brillan! Vamos al puente." |

### 7.2 Nombres de los 7 lugares (`lugares[].nombre.es`)

Plaza, escuela, colores, números, cuerpo, familia y reloj. Máximo 5 palabras y 2 s; los dice Lumi
al tocar el lugar en el mirador. Que suenen a sitio del bosque y se reconozca el tema sin saber
inglés (por ejemplo "El claro de la mochila"); la plaza, a punto de encuentro. Opcional, un
nombre en inglés de 3 palabras para el modo docente.

### 7.3 Textos de las 7 estatuas (`lugares[].estatua`)

- `texto.es`: **una sola idea**, máximo 18 palabras y 8 s contando la palabra en inglés. Dos líneas
  en la tarjeta a 390 px (unos 30 caracteres por línea).
- `palabra` (opcional): **una** palabra o expresión en inglés, de 1 a 3 palabras, del vocabulario
  del tema. Se dice con la voz inglesa después de la frase.
- Contenido: una curiosidad o un uso del tema en la vida del niño en Los Patios, o un trozo de la
  historia de Englishland (por qué esta parte perdió su luz). No repite la consigna de un ejercicio,
  no hace preguntas que pidan respuesta y no da instrucciones.
- Plaza: presenta la idea de las estatuas y del mundo. Reloj: anuncia el puente y a Nova sin
  prometer premio.
- Tono: lo dice Lumi, como quien comparte un secreto. Nada de "¿sabías que…?" repetido en las
  siete.

Entrega: en `herramientas/construir_bosque.py` o en una tabla que el desarrollador pase al guion,
con las claves de arriba.

---

## 8. Tandas de construcción

Un solo desarrollador, una tanda por vez, commit por tanda, comprobación con Playwright a
**390 × 844** (y 360 × 640, 768 × 1024, 1366 × 768 en la prueba automática), sin publicar.
Revisor después de las tandas 2 y 4. Mostrar a Manuel antes de publicar.

| Tanda | Qué | Archivos | Se acepta cuando, a 390 × 844 |
| --- | --- | --- | --- |
| 1. Datos | `lugares` con estación, estatua, encuadre y pies; `iconosJuego`; quitar 6 postes y las x, y de misiones y encargos; las 8 reglas de 3.6 detienen el guion | `construir_bosque.py`, `tipos.ts`, `cartilla.json` (generado) | El guion termina sin avisos; hay 6 estaciones con 17 misiones en total y 7 estatuas; ninguna parada a menos de 150 px de mundo de otra; cada lugar cabe en 340 × 480 |
| 2. Claro y estación | Cámara fija por lugar, toque por círculos, estación con luces, bandeja (siguiente, repetir, pendiente, cerrar), qué llama la atención y ayudas de 3.4, botón atrás. Sale el paseo libre y la brújula | `Mundo.tsx`, `Bandeja.tsx`, `estilos.css` | Al entrar, todas las paradas del lugar se ven enteras con la bandeja abierta; ninguna zona de toque mide menos de 48 px ni queda a menos de 12 px de otra o bajo un botón; la estación muestra tantas luces como ejercicios y las hechas en oro; tocar el siguiente abre la misión, uno hecho la repite, uno pendiente se mece sin abrir nada; al volver de una misión la luz se enciende y la bandeja sube con el siguiente; atrás cierra la bandeja |
| 3. Mirador y primer día | `Mirador.tsx` (reemplaza `MiniMapa.tsx`), entrada del primer día, lugar del día, burbuja | `Mirador.tsx`, `Mundo.tsx` | Siete lugares de 72 px (plaza 64) sin montarse; luces por lugar correctas; de la portada a la primera misión, 3 toques el primer día y 2 otro día |
| 4. Estatua | Estatua en el claro, tarjeta, voz con palabra en inglés, cierre (X, fuera, atrás), `mapa-estatuas` una vez | `Estatua.tsx`, `Mundo.tsx`, `estilos.css` | La estatua se toca con la bandeja abierta; la tarjeta cabe entera (330 × 400) sin desplazar; la voz empieza sola y el altavoz la repite; no se cierra sola; con el audio ausente se ve el texto |
| 5. Sesión, casa y cierre | Encargo en el sitio, luciérnagas al volver, límite de 3 luces nuevas (repetir no cuenta), luna y Lumi dormida, estación completa, puente con seis grupos y cámara al puente, pausa al pasar al fondo, celular horizontal, interruptor "sin límite" | `Mundo.tsx`, `progreso.ts`, `Familia.tsx` | Tras 3 luces nuevas los pendientes muestran luna y los hechos se pueden repetir; sacar la app al fondo 1 min y volver sigue en el mismo paso; 11 min vuelve al claro sin perder nada; con 17 luces el puente entra en cuadro; con movimiento reducido no hay desplazamientos |

Prueba nueva en `scripts/pruebas/mapa.mjs`, en las cuatro medidas: ningún par de zonas se monta ni
queda a menos de 12 px; ninguna zona mide menos de 48 px; las paradas de cada lugar entran en la
zona segura con la bandeja abierta y cerrada; de la portada a la primera misión hay tres toques.
