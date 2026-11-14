# Diseño, ronda 1: Memory, Listen & Catch, resumen para la familia, vestir al personaje y cinemáticas

Especificación para el desarrollador. Parte de lo que ya existe (`src/estilos.css`, `EscuchaToca`,
`DiBrilla`, `CierreMision`, `Album`, `Mundo`) y reutiliza sus clases siempre que se puede. Las
medidas son a 390 × 844 px (celular vertical) salvo que se diga otra cosa. Se comprobaron con
bocetos HTML y capturas de Playwright a 390 px, hechos fuera del repositorio.

Principio que ordena todo: **la luz vuelve a Englishland**. Cada acierto produce luz (una carta
que se ilumina, un farolito que entra en el frasco, Lumi que brilla más), nunca un número. El
error no apaga nada: solo deja las cosas como estaban.

---

## 0. Tokens: paleta, tipografía, escala y movimiento

Lo existente se queda igual. Se agregan variables para valores que hoy están escritos a mano
en varias reglas y para lo nuevo. Van en `:root` de `src/estilos.css`.

```css
:root {
  /* Existentes, sin cambios */
  --noche: #2a1458;
  --noche-honda: #170a36;
  --tinta: #24123f;
  --crema: #fff8ec;
  --oro: #ffcf3a;
  --oro-hondo: #f2a100;
  --menta: #19c6b1;
  --rosa: #ff5fa2;
  --sombra: 0 6px 0 rgb(23 10 54 / 0.28);

  /* Nuevos: nombran valores que ya se repiten en el CSS */
  --luz: #fffbe0;               /* fondo de lo que se encendió (decir--brilla, carta en pareja) */
  --exito: #25b56b;             /* borde de .opcion--bien */
  --exito-claro: #d9ffe9;
  --lila-suave: #6b5a8a;        /* texto secundario (album__carta small) */
  --relieve: 0 8px 0 rgb(36 18 63 / 0.16);   /* sombra de "tecla" de cartas y botones blancos */
  --relieve-bajo: 0 4px 0 rgb(36 18 63 / 0.14);
  --cielo-mision: linear-gradient(180deg, #bfe9ff 0%, #e9d8ff 55%, #ffd9ec 100%);

  /* Acento por territorio (diseno-infantil: un acento por territorio). Se fija en .mundo y
     .mision con data-territorio. Solo el Bosque está decidido; los otros son propuesta. */
  --acento: var(--menta);       /* Bosque de los Sonidos */
  /* Valle de las Palabras: var(--rosa) · Ciudad de las Frases: var(--oro-hondo)
     · Plaza del Encuentro: #6bc5ff (por confirmar al diseñar esos territorios) */

  /* Resumen para la familia (pantalla de adulto) */
  --papel: #fffdf8;
  --linea: #ece4f6;
  --reforzar: #fff7dc;
  --reforzar-borde: #ffe39a;
  --aprendida: #eefaf7;
  --aprendida-borde: #bfeee6;

  /* Escala tipográfica (Baloo 2 Variable, la única familia; no se carga ninguna otra) */
  --t-chica: 0.85rem;    /* 13,6 px: solo etiquetas de estrellas ★26 en fichas */
  --t-apoyo: 1.0625rem;  /* 17 px: texto corrido del adulto */
  --t-base: 1.25rem;     /* 20 px: mínimo de texto que lee el niño */
  --t-palabra: 1.45rem;  /* 23 px: palabra en carta de Memory */
  --t-titulo: 1.6rem;    /* 26 px: título de pantalla de adulto */
  --t-grande: 2.6rem;    /* 42 px: palabra en carta-grande */
  --t-premio: 3rem;

  /* Movimiento */
  --rebote: cubic-bezier(0.2, 1.4, 0.4, 1);  /* ya se usa en entrar-carta y opcion */
  --d-toque: 0.12s;
  --d-entrar: 0.35s;
  --d-giro: 0.42s;
  --d-celebrar: 0.6s;
}
```

Tipografía: Baloo 2 en todo, también en la pantalla de la familia (no se descarga otra
fuente; el adulto lee con peso 400 a 17 px y 1,5 de interlineado). Al niño, nada por debajo
de 20 px salvo las fichitas ★N.

### Una trampa del CSS actual que afecta a esta ronda

La regla global de `prefers-reduced-motion` reduce toda animación a 0,01 ms con una sola
iteración. Para los farolitos de Listen & Catch eso significa que **saltan al final de su
caída y desaparecen al instante**: el juego queda imposible. Por eso Listen & Catch decide su
modo en JavaScript (`matchMedia('(prefers-reduced-motion: reduce)')`) y no depende del CSS
(ver 2.7). Memory sí puede apoyarse en el CSS, pero se le da una versión con opacidad.

---

## 1. Juego "Memory" (plantilla `memoria`)

Archivo sugerido: `src/juegos/Memoria.tsx`. Recibe `mision`, `base`, `idiomaVoz`,
`imagenFiesta`, `onTerminar`, `onSalir`, igual que `EscuchaToca`. Termina con `CierreMision`.

### 1.1 La idea en una frase

Cartas boca abajo; cada palabra tiene dos: una con el **dibujo** y otra con la **palabra
escrita**. **Las dos dicen la palabra en voz alta al girar**, así que el niño que no lee
empareja por el oído (regla 2) y el que lee además ve la escritura.

### 1.2 Contenido y cantidad de cartas

- Usa `mision.palabras`. Toma 3 palabras (6 cartas) o 4 (8 cartas), mezcladas con `mezclar`.
- **Primera vez que juega esa misión: 6 cartas.** Si la termina con 2 giros fallidos o menos,
  la próxima vez son 8. Si con 8 falla 8 veces o más, la próxima vuelve a 6. No se anuncia.
  Se guarda en el registro de la misión (`RegistroMision.nivel?: 6 | 8`).
- Opción de contenido para preescolar: `mision.pares: 'palabra' | 'sonido'` (por defecto
  `'palabra'`). Con `'sonido'` la segunda carta no muestra texto, solo un oído grande 👂: el
  emparejamiento es dibujo ↔ sonido.
- Tipos: `Mision.plantilla` suma `'memoria'`; `Mision.pares?` opcional.

### 1.3 Disposición a 390 px

**8 cartas: cuadrícula de 3 × 3 con Lumi en la casilla del centro.** Lumi está en medio del
juego, ve cada carta y reacciona; es la que da la ayuda.

```
┌──────────────────────────────────────┐ 390
│ (✕)        ●  ●  ◉  ○                │  .mision__barra 68 px; un punto por pareja
│                                      │
│                                      │
│  ┌───────┐  ┌───────┐  ┌───────┐     │
│  │   ★   │  │   ★   │  │   ★   │     │  carta 111 × 148
│  │ dorso │  │       │  │       │     │  separación 12
│  └───────┘  └───────┘  └───────┘     │
│  ┌───────┐   (Lumi)    ┌───────┐     │  Lumi: casilla 111 × 148, imagen al 92 %
│  │   ★   │    ✦ ✦      │   ★   │     │
│  └───────┘             └───────┘     │
│  ┌───────┐  ┌───────┐  ┌───────┐     │
│  │   ★   │  │   ★   │  │   ★   │     │
│  └───────┘  └───────┘  └───────┘     │
│                                      │  tablero 358 × 468, centrado en vertical
└──────────────────────────────────────┘
```

- Área útil: 390 − 2 × 16 de margen = 358 px. Carta = (358 − 2 × 12) / 3 = **111 × 148 px**
  (proporción 3:4). Tablero = 3 × 148 + 2 × 12 = **468 px de alto**; sobra aire arriba y abajo.
- A 320 px de ancho: cartas de 88 × 117. Siguen muy por encima de 48 px.

**6 cartas: cuadrícula de 3 × 2 y Lumi arriba**, en un botón redondo que reutiliza `.oir`
(120 px) con 💡 en lugar de 🔊 en `.oir__onda`. Tocar a Lumi pide ayuda (ver 1.6).

```
┌──────────────────────────────────────┐
│ (✕)          ●  ◉  ○                 │
│                                      │
│              ( Lumi 💡)              │  .oir 120 px
│                                      │
│  ┌───────┐  ┌───────┐  ┌───────┐     │
│  │   ★   │  │  🔵   │  │   ★   │     │
│  └───────┘  └───────┘  └───────┘     │
│  ┌───────┐  ┌───────┐  ┌───────┐     │
│  │   ★   │  │ green │  │   ★   │     │
│  └───────┘  │  🔊   │  └───────┘     │
│             └───────┘                │
└──────────────────────────────────────┘
```

**Tableta y computador:** el tablero crece hasta `max-width: 420px` (cartas de 132 × 176).
Si la pantalla es horizontal y mide menos de 700 px de alto, 6 cartas van en 3 × 2 con Lumi a
la izquierda (`grid-template-columns: auto 1fr`).

### 1.4 Las cartas

Estructura (la vuelta va en un elemento interior para que no choque con el hundido del botón):

```html
<button class="carta [es-boca-arriba] [es-pareja] [es-pista]" aria-label="Carta 3">
  <span class="carta__giro">
    <span class="carta__cara carta__dorso" aria-hidden="true">★</span>
    <span class="carta__cara carta__frente">…dibujo o palabra…</span>
  </span>
</button>
```

| Parte | Aspecto |
| --- | --- |
| Dorso | Fondo `radial-gradient(120% 90% at 50% 0%, #4a2394, var(--noche))`, un círculo `#5b2fa6` al centro con ★ en `--oro` a 2.2rem, borde de 4 px `rgb(255 207 58 / .35)`, radio 22 px, sombra `--relieve`. Todos iguales: nada en el dorso delata la carta. |
| Frente de dibujo | Blanco, el icono de la palabra al 60 % del ancho. Sin texto. |
| Frente de palabra | Blanco, la palabra en `--t-palabra` peso 800 (`lang="en"`) y debajo 🔊 pequeño al 50 % de opacidad. Palabras largas ("grandmother") bajan a 1.15rem con `font-size: clamp()` sobre el ancho de la carta. |
| Frente de sonido (`pares: 'sonido'`) | Blanco, 👂 a 3rem. |
| En pareja (`.es-pareja`) | Fondo `--luz`, sombra `0 8px 0 var(--oro-hondo), 0 0 0 4px var(--oro)`: el mismo lenguaje que `.decir--brilla`. |
| Pista (`.es-pista`) | En el dorso: `0 0 0 5px var(--oro)` y `brincar` 0,9 s en bucle (igual que `.opcion--pista`). |

CSS clave:

```css
.memoria__tablero { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  width: min(100%, 420px); perspective: 900px; }
.carta { position: relative; aspect-ratio: 3 / 4; transition: transform var(--d-toque); }
.carta:active { transform: translateY(4px); }
.carta__giro { position: absolute; inset: 0; transform-style: preserve-3d;
  transition: transform var(--d-giro) cubic-bezier(0.2, 1.2, 0.4, 1); }
.carta.es-boca-arriba .carta__giro { transform: rotateY(180deg); }
.carta__cara { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 22px;
  display: grid; place-items: center; align-content: center; gap: 4px; box-shadow: var(--relieve); }
.carta__frente { background: #fff; transform: rotateY(180deg); }
```

Solo se animan `transform` y `opacity`. Nada de `box-shadow` animado en las cartas.

### 1.5 Qué pasa al tocar

| Momento | En pantalla | Se oye |
| --- | --- | --- |
| Entra el juego | Las cartas aparecen en cascada con `entrar-carta` (0,35 s, 40 ms de retraso entre una y otra). Lumi entra con `flotar`. | `toque` suave al terminar la cascada. |
| **Primera vez en la vida** que juega Memory | Lumi gira sola una carta y luego su pareja, despacio (ejemplo que se juega solo). Después aparece una manita 👆 de 48 px sobre una carta con `brincar`, hasta el primer toque. Se marca en `progreso.vistas` (`'tutorial-memoria'`). | La voz dice las dos palabras y Lumi: "¡Iguales! Ahora tú." |
| Toca una carta boca abajo | Gira en 0,42 s. | `girar` al tocar; la palabra en inglés (`decir`) al llegar a la mitad del giro (200 ms). |
| Toca la segunda carta y **son pareja** | Ambas pasan a `.es-pareja` con `celebrar` 0,6 s. Una chispa (`.chispa`, 10 px, `--oro`) viaja desde cada carta hasta Lumi en 0,5 s. El halo de Lumi crece un escalón (ver abajo). El punto de la barra se llena. | `pareja` (no se repite la palabra; ya se dijo dos veces). |
| Toca la segunda carta y **no son pareja** | Las dos se quedan boca arriba 1,1 s para que se vean y se oigan, y vuelven boca abajo. Lumi inclina la cabeza (−6°, 0,4 s): mira, no juzga. **Sin temblor, sin gris, sin sonido de error.** | Las dos palabras (cada una al girar) y `volver` muy bajo al darse vuelta. |
| Toca una tercera carta mientras las dos fallidas siguen arriba | Las dos se voltean ya y la nueva gira enseguida: el niño no espera. | `girar` + palabra. |
| Toca una carta en pareja | No gira. `latir` una vez (0,3 s). | Repite la palabra: sirve para practicar. |
| Toca la carta que ya está boca arriba sola | `latir`. | Repite la palabra. |
| Toca a Lumi | `celebrar` corto. | Ayuda de nivel 1 al instante (ver 1.6). |
| Última pareja | Todas las cartas hacen `celebrar` a la vez; Lumi queda brillando al máximo. A los 0,9 s, cortina y `CierreMision`. | `fiesta`. |

**El halo de Lumi** (la luz que vuelve): un `::before` detrás de Lumi, círculo
`radial-gradient(var(--oro) 0 30%, transparent 70%)` con `opacity` 0,15 → 0,35 → 0,55 → 0,8 →
1 según las parejas hechas. Se anima solo la opacidad (0,4 s).

**Bloqueo:** mientras una carta está a mitad de giro (420 ms), se ignoran toques sobre esa
misma carta. Las demás siguen respondiendo.

### 1.6 Ayuda de Lumi si se atasca

Cuenta `seguidos` (giros fallidos desde la última pareja) y `quieto` (segundos sin tocar).
La ayuda nunca gira cartas por el niño ni le quita nada.

| Nivel | Se dispara | Qué hace Lumi |
| --- | --- | --- |
| 1 | 3 fallos seguidos, 15 s sin tocar o toque sobre Lumi | `brincar` dos veces y habla: "Escucha bien: cada dibujo tiene su palabra." |
| 2 | 5 fallos seguidos o 25 s sin tocar | Si hay una carta sola boca arriba, el dorso de su pareja se marca `.es-pista`. Si no, se marca una carta cuya pareja ya se vio. Dice: "Mira, por aquí." La pista se quita al primer toque. |
| 3 | Otros 3 fallos después de la pista | Se marcan los dos dorsos de una pareja con `.es-pista`. |

Al hacer pareja, `seguidos` vuelve a 0 y la ayuda se reinicia. Las frases de Lumi viven en
el contenido (regla 1), en `cartilla.ayudas.memoria` con `es` y `en` (respetan `ModoIdioma`).
El pedagogo las revisa.

### 1.7 Qué se registra (para `CierreMision` y la familia)

- `errores` = giros fallidos. Solo sirve para la medalla de mejorar (`premiosDeMision`); nunca
  se muestra.
- Una palabra **costó** si se giró alguna de sus cartas 3 veces o más antes de hacer pareja.
  Va a `anotarPractica(bien, costaron)` igual que en `EscuchaToca`.

### 1.8 Estados

| Estado | Qué se ve |
| --- | --- |
| Inicial | Todas boca abajo, Lumi con halo 0,15, puntos vacíos. |
| Acierto | Pareja en `--luz` con borde de oro, chispas hacia Lumi, punto lleno. |
| Error | Las dos cartas visibles 1,1 s y vuelven. Lumi inclina la cabeza. Nada más. |
| Vacío | La misión trae menos de 3 palabras: no se arma el juego y se usa `EscuchaToca` en su lugar (el niño no ve nada distinto). Se avisa en consola para el autor del contenido. |

Duración estimada: 6 cartas en unos 1,5 min; 8 cartas en 2 a 3 min.

---

## 2. Juego "Listen & Catch" (plantilla `escucha-atrapa`)

Archivo sugerido: `src/juegos/EscuchaAtrapa.tsx`. Mismas props que `EscuchaToca`
(incluye `imagenGuia`). Termina con `CierreMision`.

### 2.1 La idea en una frase

Cosmo dice una palabra. Desde arriba bajan **farolitos de luz** flotando despacio, cada uno
con un dibujo. El niño toca el que corresponde y el farolito vuela a un **frasco** que se va
llenando de luz. Los farolitos que no se tocan se apagan en la niebla de abajo y vuelven a
salir: **nunca se pierde una oportunidad**.

### 2.2 Disposición a 390 px

```
┌──────────────────────────────────────┐
│ (✕)        ●  ●  ◉  ○  ○  ○          │  barra 68 px, texto crema (fondo oscuro)
│              ┌──────┐                │
│              │Cosmo │🔊              │  .oir 96 px, centro, top 76
│              └──────┘                │  ── límite superior de caída: y = 180
│   ( 🔴 )                             │
│                         ( 🔵 )       │  farolitos de 88 px en 3 carriles
│              ( 🟢 )                  │  centros en x = 65, 195, 325
│                                      │  caen de y = 180 a y = 684 (504 px)
│   ( 🟡 )                             │
│                                      │
│ ░░░░░░░░░░ niebla (degradado) ░░░░░░ │  y = 640–684: el farolito se desvanece
│              ┌──────┐                │
│              │frasco│                │  104 × 120, centrado, 16 px del borde
│              └──────┘                │
└──────────────────────────────────────┘
```

- Fondo: `linear-gradient(180deg, var(--noche-honda) 0%, var(--noche) 60%, #2f3f5e 100%)` y
  un resplandor verde de pasto abajo
  (`radial-gradient(130% 70% at 50% 110%, #3d6b4f 0 18%, transparent 40%)`). Es el bosque de
  noche visto hacia el cielo. Sin imágenes: 0 KB.
- La barra cambia el color del texto y de los puntos para fondo oscuro:
  `.mision--noche .punto { background: rgb(255 248 236 / .25) }`.
- **Tableta y computador:** zona de juego de 560 px de ancho máximo, centrada; 4 carriles si
  el ancho útil pasa de 520 px. La caída se mide en tiempo, no en píxeles: cuanto más alta la
  pantalla, más rápido baja en px/s, pero tarda lo mismo.

### 2.3 El farolito

```html
<button class="farolito" style="--carril: 0; --caida: 7s" aria-label="red">
  <span class="farolito__luz">        <!-- aquí van el temblor y el acierto -->
    <img src="iconos/1f534.svg" alt="" width="52" height="52">
  </span>
</button>
```

- **Dos elementos a propósito**: `.farolito` lleva solo la caída (`transform` animado con
  `@keyframes caer`) y `.farolito__luz` lleva el temblor, el brillo y la escala. Si se ponen
  en el mismo elemento, el temblor borra la caída.
- Se ve: 88 px, `border-radius: 50%`, fondo
  `radial-gradient(circle at 50% 45%, #fffbe8 0 52%, rgb(255 226 122 / .75) 53% 62%, transparent 72%)`.
  El halo es parte del degradado, no una sombra: no cuesta nada en gama baja.
- Zona de toque: **104 px** (`::before` con `inset: -8px`), por encima de los 64 px para lo
  principal.
- Caída: `@keyframes caer { from { transform: translate3d(0, 0, 0) } to { transform: translate3d(var(--deriva), 504px, 0) } }`
  con `--deriva` entre −16 y 16 px (vaivén leve de semilla), `linear`, duración `--caida`.
  A 390 px son 72 px/s con 7 s.
- Se escucha `pointerdown`, no `click`: responde al instante aunque el farolito se mueva.

### 2.4 Ritmo

- 6 rondas, una palabra cada una, tomadas de `mision.palabras`.
- Cada ronda: Cosmo dice la palabra (350 ms después de empezar, como `EscuchaToca`). Sale un
  farolito cada **1,6 s** en un carril distinto al anterior. **Como mucho 3 a la vez** en
  pantalla.
- El **segundo** farolito de cada ronda es siempre el correcto (le da tiempo a oír); después,
  uno de cada tres. Si el correcto pasa sin tocarse, el siguiente que sale es otro correcto.
- Caída base: **7 s**. Si atrapa 3 seguidos al primer intento, 6 s (mínimo 5,5 s). Si deja
  pasar el correcto 2 veces o se equivoca 2 veces seguidas, 8,5 s (máximo 9 s). No se anuncia.
- Si el correcto pasa 2 veces sin tocarse: Cosmo repite la palabra y el siguiente correcto
  sale con `.es-pista` (contorno de oro de 5 px y `latir`).
- **No hay reloj ni límite de rondas fallidas.** Una ronda solo termina cuando atrapa la
  palabra.

### 2.5 Qué pasa al tocar

| Momento | En pantalla | Se oye |
| --- | --- | --- |
| Toca el correcto | El farolito se detiene donde está (se lee su posición con `getBoundingClientRect`, se fija y se quita la animación). `.farolito__luz` hace `celebrar` 0,3 s y luego vuela al frasco en 0,45 s (`transform` hasta el centro del frasco, escala 0,4, opacidad a 0). El frasco sube un nivel de luz. Los otros farolitos se desvanecen en 0,3 s. | `atrapar` al tocar, la palabra (`decir`) y `frasco` al llegar. |
| Toca otro | `.farolito__luz` hace `temblar` (0,4 s) y el farolito sigue cayendo con opacidad 0,35 y sin responder a más toques (igual que `.opcion--no`). | `intenta` (los dos tonos bajos ya existentes) y, 500 ms después, Cosmo repite la palabra. |
| Toca a Cosmo | `latir` una vez. | Repite la palabra. |
| Toca el fondo | Una `.onda-toque` donde tocó (feedback de que el toque llegó). | Nada. |
| Siguiente ronda | 0,9 s después del acierto. | Cosmo dice la palabra nueva. |
| Sexta palabra | El frasco brilla lleno (`celebrar`) y Lumi aparece encima. | `fiesta`, luego `CierreMision`. |

**El frasco** es el progreso visible en el mundo: 104 × 120 px, vidrio con borde de 5 px
`rgb(255 255 255 / .7)` y una tapa de corcho. Por dentro, una capa de luz `--oro` cuya altura
sube un sexto por palabra. Para que sea barato, la capa es de alto fijo y se mueve con
`transform: translateY()`, no cambiando `height`. Los puntos de la barra se mantienen por
coherencia con los otros juegos.

### 2.6 Gama baja

- Como mucho 4 nodos animados a la vez (3 farolitos y el que vuela al frasco).
- Solo `transform` y `opacity`; `will-change: transform` solo en `.farolito`.
- Sin `filter`, sin `blur`, sin `box-shadow` en lo que se mueve.
- `.escucha-atrapa { contain: layout paint; }`.
- Los farolitos se crean y se quitan con `animationend`; no hay bucle de `requestAnimationFrame`.
- Si la pestaña se oculta (`visibilitychange`), se pausa todo con
  `.escucha-atrapa--pausa .farolito { animation-play-state: paused }` y se reanuda al volver.

### 2.7 Con `prefers-reduced-motion`

Nada cae. Aparecen **3 farolitos quietos**, uno por carril y a alturas escalonadas
(y = 260, 420, 340), con fundido de opacidad de 0,3 s. Se quedan hasta que el niño toque. El
acierto se celebra con un cambio de opacidad del farolito y el frasco sube igual. En la
práctica se juega como "escucha y toca", pero con farolitos. Esto se decide en JS (ver 0).

### 2.8 Qué se registra

- `errores` = toques en un farolito que no era.
- Una palabra costó si tuvo un toque equivocado o si el correcto pasó 2 veces sin tocarse.

### 2.9 Estados

| Estado | Qué se ve |
| --- | --- |
| Inicial | Cielo vacío, Cosmo arriba, frasco vacío. El primer farolito sale a 1 s. |
| Acierto | El farolito vuela al frasco; el frasco sube un sexto de luz. |
| Error | El farolito tiembla y se vuelve translúcido; Cosmo repite la palabra. Los demás siguen. |
| Vacío | La misión tiene menos de 3 palabras: se usa `EscuchaToca`. |

Duración estimada: unos 2 minutos.

---

## 3. Resumen para la familia

Archivo sugerido: `src/Familia.tsx`. Es una pantalla para el adulto: sobria, texto corrido y
sin animaciones de juego.

### 3.1 Dónde se abre

- **En la pantalla de inicio**, donde hoy está "Empezar de nuevo": un enlace con la clase
  `.enlace` que dice **"Para la familia"**. Es pequeño, está abajo y es solo texto. El niño
  que no lee no lo toma por un botón de juego (no rebota ni brilla) y no aparece en el mundo
  ni en el álbum, así que no estorba.
- No lleva candado. Si un niño que lee entra, encuentra una página de texto tranquila con
  "Volver". No hay nada que pueda dañar.
- **"Empezar de nuevo" se muda aquí, al final del resumen**, y sí lleva protección: hoy
  cualquier niño puede borrar su progreso desde el inicio con un toque. Se confirma con un
  diálogo: "¿Borrar el avance de este dispositivo? Se pierden las estrellas y el álbum." y un
  botón "Borrar" que hay que **mantener presionado 2 segundos** mientras se llena un anillo.
  Al niño eso no se le pide nunca, y la instrucción solo la entiende quien lee.
- Cuando exista Supabase, el docente imprime el mismo resumen por estudiante desde su modo.

### 3.2 Qué muestra, en este orden

Primero lo que el adulto puede hacer hoy y después lo demás. Todo sale de `progreso` y de la
cartilla; nada técnico, nada en porcentajes.

```
┌──────────────────────────────────────┐ fondo --papel, texto --tinta
│ Lo que practicó en inglés   [Volver] │ h1 26 px / 700 · Volver 48 px, pastilla --noche
│                                      │
│ Bosque de los Sonidos. 6 de 11       │ p 17 px / 1.5, máx. 62 caracteres
│ misiones completas y 31 estrellas.   │
│ Ayudó a 2 vecinos del bosque.        │
│                                      │
│ Para reforzar en casa                │ h2 19 px / 700
│ Estas palabras le costaron un poco.  │
│ Toque 🔊 para oírlas y pídale que    │
│ las repita con usted.                │
│ ┌──────────────────────────────────┐ │ fila 56 px, fondo --reforzar,
│ │ 🟠 orange               (🔊)     │ │ borde --reforzar-borde
│ │    naranja                       │ │ 🔊 de 48 px
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 📏 ruler                (🔊)     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Ya las reconoce                      │
│ (🔴 red) (🔵 blue) (🟢 green)        │ fichas --aprendida, se tocan y suenan
│ (✏️ pencil) (📓 notebook) …          │
│                                      │
│ Repasó por su cuenta                 │
│ Volvió a jugar Colors y le fue mejor │
│ que la primera vez.                  │
│                                      │
│ Cómo se sintió                       │
│ Al terminar las misiones eligió 😄    │
│ 4 veces, 🙂 1 vez y 🤔 1 vez.         │
│                                      │
│ Una idea para hacer juntos           │
│ Busquen en casa tres cosas de un     │
│ color y nómbrenlas en inglés. Cinco  │
│ minutos bastan.                      │
│                                      │
│ Las estrellas reconocen el esfuerzo  │ 15 px, --lila-suave
│ en la cartilla; no son la nota.      │
│                                      │
│ [ Imprimir ]                         │ 52 px, --noche
│                                      │
│ Borrar el avance de este dispositivo │ .enlace, gris, al final
└──────────────────────────────────────┘
```

| Sección | De dónde sale |
| --- | --- |
| Encabezado | Misiones con registro / total del territorio, `estrellas`, `ayudados.length`. Cuando haya cuentas, el apodo ("Lo que Sofi practicó en inglés"). Hoy no hay nombre: no se usa el del personaje, que confunde. |
| Para reforzar | `progreso.repasar`, con icono, inglés, español y 🔊 (`decir`). |
| Ya las reconoce | Palabras de misiones completas que no están en `repasar`. |
| Repasó por su cuenta | Misiones con `veces > 1`; si `mejoras > 0`, "le fue mejor que la primera vez". |
| Cómo se sintió | Conteo de `autoeval` (3 = 😄, 2 = 🙂, 1 = 🤔). Si hay más 🤔 que 😄: "Si quiere, pregúntele qué le pareció difícil." |
| Idea para hacer juntos | **Contenido nuevo** (regla 1): `mision.familia?: { es: string }` por tema. Se elige la del tema con más palabras por reforzar o, si no hay, la del último tema jugado. Es una sugerencia, nunca una tarea. |

### 3.3 Estados

| Estado | Qué se ve |
| --- | --- |
| Vacío (ninguna misión) | "Todavía no hay misiones completas. Cuando termine la primera, aquí verá las palabras que practicó." y "Volver". Sin botón de imprimir. |
| Nada por reforzar | La sección dice: "Ninguna palabra le ha costado hasta ahora." |
| Con datos | Como el boceto. |

En esta pantalla no hay acierto ni error. Entra con la `cortina` de siempre y sale con
"Volver" al inicio.

### 3.4 Versión imprimible (regla 9)

Una hoja carta, en blanco y negro, desde `@media print` en la misma pantalla. No hace falta
generar un PDF.

```css
@media print {
  @page { size: letter; margin: 16mm; }
  body { background: #fff; overflow: visible; }
  .familia { height: auto; overflow: visible; padding: 0; background: #fff; color: #000; }
  .familia button, .familia__borrar { display: none; }
  .familia__lista li, .familia__chips span { background: none; border: 1px solid #999; break-inside: avoid; }
  .familia__lista, .familia__chips { columns: 2; column-gap: 12mm; }
  .familia__imprimir-solo { display: block; }   /* oculto en pantalla */
}
```

Lo que agrega la versión impresa: arriba, el título de la cartilla, el grado y la fecha de
impresión. Abajo, dos renglones vacíos con "Observaciones de la familia" y "Observaciones de
la docente", para que la hoja vaya y vuelva en el cuaderno. Los iconos SVG se imprimen bien.

---

## 4. Vestir al personaje (accesorios)

### 4.1 Qué se puede poner

Tavi, Mika y Bruno son **astronautas con casco de burbuja**. Los accesorios tienen que
funcionar encima de ese casco o alrededor del traje, no dentro. En el boceto, un emoji de
bufanda quedó pegado sobre la cara de Mika, dentro del casco, y se veía mal.

Cuatro ranuras, una prenda por ranura, combinables:

| Ranura | Dónde va | Accesorios del Bosque | Se abre con |
| --- | --- | --- | --- |
| `cuello` | Sobre el cuello del traje, debajo del casco | Bufanda de rayas | ★ 4 (la primera misión) |
| `cara` | Sobre el vidrio del casco, a la altura de los ojos | Gafas de estrella | ★ 9 |
| `cabeza` | Encima del casco | Antena con luciérnaga | ★ 18 |
| `espalda` | Detrás del cuerpo | Capa de hojas | ★ 27 |
| `cabeza` | Encima del casco | Corona de flores | ★ 36 |
| `espalda` | Detrás del cuerpo | Mochila cohete | ★ 45 |

Los umbrales se intercalan con las estelas (12, 26, 40): casi cada misión trae algo nuevo.
**No se gastan estrellas**; se abren al llegar al número, como las estelas (regla 5: nunca se
quitan). No hay tienda ni precio. Cada territorio puede traer los suyos en el contenido.

### 4.2 Formato: WebP ilustrado pequeño (no emoji ni SVG dibujado a mano)

| Opción | Peso | Por qué sí o por qué no |
| --- | --- | --- |
| Emoji | 0 KB | Cambia de dibujo según el teléfono (Android, iPhone y Windows lo dibujan distinto), no se puede anclar ni rotar con precisión y en algunos Android viejos ni existe. El boceto lo confirmó: se ve pegado. |
| SVG vectorial | 1 a 3 KB | Liviano y nítido, pero los personajes son ilustraciones pintadas de Canva; un vector plano al lado desentona. Canva no exporta esas piezas como vector limpio. |
| **WebP con transparencia, mismo estilo de Canva** | **3 a 6 KB cada uno** | Combina con los personajes, se ancla y se escala igual que el héroe. Los seis pesan unos 30 KB en total y solo se descargan al abrir el vestidor o al llevar puesta la pieza. |

Elección: **WebP de 128 × 128 px** (dibujado de frente, con el centro de anclaje en el centro
de la imagen). En el mundo el héroe mide 58 a 64 px de ancho por la escala del mundo (0,75 a
2); una pieza al 60 % del héroe ocupa como mucho unos 77 px en pantalla, y 128 px cubren
pantallas de densidad 2. **Para probar antes de tener el arte**, se pueden usar provisionalmente
iconos Noto del paquete `@svgmoji/noto` (de donde salieron los iconos actuales: `1f9e3`
bufanda, `1f451` corona; hoy no están en `iconos/`), solo para ajustar las anclas y sin
publicarlos.

### 4.3 Cómo se dibuja encima del personaje

Contenido nuevo en `cartilla.json` (regla 1):

```jsonc
"accesorios": [
  { "id": "bufanda", "ranura": "cuello", "estrellas": 4, "imagen": "accesorios/bufanda.webp", "ancho": 0.62 }
],
"heroes": [
  { "id": "mika", …,
    "anclas": { "cabeza": [0.50, 0.04], "cara": [0.50, 0.30], "cuello": [0.48, 0.47], "espalda": [0.45, 0.58] } }
]
```

Las anclas son fracciones de la imagen del héroe (0 a 1), medidas una vez por personaje. Mika
es más alta por las orejas (170 × 356 frente a 170 × 280), así que su `cabeza` va entre las
orejas, no en la punta. `ancho` es la fracción del ancho del héroe.

En `Mundo.tsx`, dentro de `.guia__cuerpo`:

```html
<div class="guia__figura">                      <!-- aquí pasan respirar, trotar y el espejo -->
  <img class="guia__accesorio guia__accesorio--espalda" …>   <!-- z-index 0, detrás -->
  <img class="guia__heroe" src="heroe-2.webp" …>              <!-- z-index 1 -->
  <img class="guia__accesorio guia__accesorio--cuello" …>    <!-- 2 -->
  <img class="guia__accesorio guia__accesorio--cara" …>      <!-- 3 -->
  <img class="guia__accesorio guia__accesorio--cabeza" …>    <!-- 4 -->
</div>
```

```css
.guia__figura { position: relative; transform-origin: 50% 100%;
  animation: respirar 2.2s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgb(255 240 170 / 0.55)); }   /* un solo filtro para todo */
.guia[data-anda='si'] .guia__figura { animation: trotar 0.34s ease-in-out infinite alternate; }
.guia[data-mira='izq'] .guia__figura { scale: -1 1; }
.guia__accesorio { position: absolute; left: calc(var(--x) * 100%); top: calc(var(--y) * 100%);
  width: calc(var(--ancho) * 100%); translate: -50% -50%; animation: none; filter: none; }
```

**Cambio necesario:** hoy `respirar`, `trotar`, el filtro y el espejo están en `.guia img`.
Hay que subirlos a `.guia__figura`; si no, cada accesorio respiraría por su cuenta y no
giraría con el personaje.

Progreso nuevo: `accesorios?: Partial<Record<'cabeza'|'cara'|'cuello'|'espalda', string>>` y
`accesoriosVistos?: string[]` (para saber cuál es nuevo). No es un dato personal.

### 4.4 Dónde se eligen: el vestidor

Un tercer botón en `.utiles`, arriba del álbum: **la cara del propio personaje** (62 px, la
misma imagen del héroe recortada con `object-fit: cover; object-position: 50% 15%`, 0 KB
extra). Tocar a tu personaje para vestirlo se entiende sin leer. Las **estelas se mudan aquí
desde el álbum**: son del personaje, no de las palabras, y el álbum queda solo para palabras.

```
┌──────────────────────────────────────┐ .panel (fondo oscuro translúcido)
│ ┌──────────────────────────────────┐ │ .panel__caja
│ │ ★ 22                        (✕)  │ │ .panel__cabeza
│ │ ┌──────────────────────────────┐ │ │
│ │ │          🌼                  │ │ │ .vestidor__escena 220 px de alto,
│ │ │        ( Mika )              │ │ │ fondo radial --noche → #6b2fbf,
│ │ │        con bufanda           │ │ │ héroe a 110 px de ancho con sus piezas
│ │ └──────────────────────────────┘ │ │
│ │   (oro) (menta) (★26) (★40)      │ │ .estelas (sin cambios de estilo)
│ │ ┌────────┐┌────────┐┌────────┐   │ │
│ │ │ bufanda││ gafas  ││ antena │   │ │ .vestidor__una 96 × 96, 3 por fila
│ │ └────────┘└────────┘└────────┘   │ │ puesta: borde oro (como .es-elegido)
│ │ ┌────────┐┌────────┐┌────────┐   │ │
│ │ │  capa  ││ silueta││ silueta│   │ │ cerrada: silueta + ★36 / ★45
│ │ └────────┘│  ★36   ││  ★45   │   │ │
│ │           └────────┘└────────┘   │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

| Toque | Qué pasa | Se oye |
| --- | --- | --- |
| Pieza abierta y no puesta | Aparece sobre el héroe de la vista previa con `entrar-carta` (0,35 s) y el héroe hace `brincar` una vez. Si la ranura tenía otra, esa se va con opacidad. La ficha queda con borde de oro. Se guarda al instante; no hay "Aceptar". | `vestir` |
| Pieza puesta | Se quita (opacidad 0,2 s). | `quitar` |
| Pieza cerrada | La ficha hace `temblar` corto. **No usar `disabled`**: un botón deshabilitado no responde y todo toque debe responder. | Lumi: "¡Pronto! Sigue encendiendo el bosque." |
| Pieza nueva aún no vista | La ficha se ve envuelta (cinta en cruz `--rosa` hecha con dos `linear-gradient`). Al tocarla, la cinta se abre (`celebrar`) y la pieza se pone sola. | `regalo` |
| ✕ | Cierra el panel; el personaje del mundo ya lleva lo elegido. | `toque` |

Ficha cerrada: la imagen con `filter: brightness(0) opacity(.25)` (silueta) y `★N` en la
pastilla de `.estelas__una span`. Es un filtro estático, no animado. El mismo arreglo de
`disabled` conviene aplicarlo a `.estelas__una`.

**Cuando se abre una pieza nueva** (al volver al mundo después de `CierreMision`), el botón
del vestidor muestra un punto de oro con ✦ (como `.utiles small`) y hace `latir` hasta que se
abra el vestidor. No interrumpe al niño con un aviso a pantalla completa.

### 4.5 Estados

| Estado | Qué se ve |
| --- | --- |
| Inicial (0 estrellas) | El héroe sin nada, la estela de oro elegida y las seis fichas en silueta. |
| Acierto (se pone una pieza) | La pieza aparece encima, el héroe brinca y la ficha tiene borde de oro. |
| "Error" (toca una cerrada) | La ficha tiembla y Lumi anima. No hay mensaje de "no tienes". |
| Vacío | Si el territorio no trae accesorios, el panel muestra solo la vista previa y las estelas. |

---

## 5. Cinemáticas en video

Archivo sugerido: `src/Cine.tsx`, una capa a pantalla completa (`z-index` 40, debajo de la
`cortina`).

### 5.1 Cuándo aparece

| Momento | Disparo | Una sola vez |
| --- | --- | --- |
| Llegada al Bosque | Después de elegir personaje, antes de la primera escena de Pixie. | Sí |
| Llegada a cada territorio nuevo | Al cruzar el puente por primera vez. | Sí |
| Cierre de un camino | Al volver al mundo después de completar la **segunda** misión de un camino, cuando su claro ya se encendió (1,2 s después, para que primero se vea la luz). | Sí |

Se marca como vista en `progreso.vistas` (`'video:<id>'`). No se repite sola. (Volver a verla
queda como decisión; ver al final.)

Contenido nuevo:

```jsonc
"videos": [
  { "id": "llegada-bosque", "archivo": "videos/llegada-bosque.mp4",
    "poster": "videos/llegada-bosque.webp", "segundos": 24,
    "cuando": { "tipo": "llegada", "territorio": "bosque" },
    "escenaRespaldo": "intro-pixie",            // la misma historia como diálogo narrado
    "subtitulos": "videos/llegada-bosque.vtt" } // opcional
]
```

### 5.2 Qué se ve

```
┌──────────────────────────────────────┐ fondo --noche-honda con estrellas fijas
│                                (⏭)  │ saltar: 56 px, arriba a la derecha
│                                      │
│   ┌──────────────────────────────┐   │
│   │                              │   │ video 1:1 → 390 × 390
│   │        póster / video        │   │ (16:9 → 390 × 219)
│   │                              │   │
│   │             (▶)              │   │ .boton-jugar 112 px sobre el póster
│   │                              │   │
│   └──────────────────────────────┘   │
│                                      │
│   Englishland perdió su luz…         │ subtítulo opcional, 20 px crema,
│                                      │ en el espacio libre, no sobre el video
└──────────────────────────────────────┘
```

1. **Entra** con fundido de opacidad (0,3 s) sobre el mundo. Se baja el ambiente
   (`atenuarAmbiente(true)`) y se calla la voz (`callar()`).
2. **Póster con ▶**: lo primero que se ve es el póster (WebP pequeño, ya en el paquete) con el
   `.boton-jugar` de siempre latiendo. **El niño toca para empezar.** Es un solo toque claro y,
   además, garantiza que el video pueda sonar: iPhone y algunos Android bloquean el sonido si
   el video arranca sin un toque.
3. **Mientras carga** (después del toque): el póster sigue visible y, si a los 300 ms aún no
   empieza, aparece encima un aro de 64 px (borde de 6 px `rgb(255 207 58 / .25)` con la parte
   de arriba en `--oro`) girando una vez por segundo. Antes de 300 ms no se muestra, para que
   no parpadee.
4. **Durante el video**: sin barra de controles, sin línea de tiempo, sin pausa al tocar el
   video (los niños tocan la pantalla sin querer). Solo está el botón de saltar. Si la pestaña
   se oculta, el video se pausa y sigue al volver.
5. **Sale** al terminar (`ended`) o al saltar: fundido de 0,3 s, se restaura el ambiente y
   sigue lo que tocaba (la escena de diálogo o el mundo).

**Botón saltar ⏭**: 56 px, círculo `rgb(255 248 236 / .18)` con borde de 3 px
`rgb(255 248 236 / .55)`. Está visible desde el primer segundo (lo pidió Manuel), en la
esquina superior derecha: lejos del centro, donde el niño toca sin querer. Suena `toque`.

**Si no se puede ver** (sin conexión y sin copia guardada, error del archivo o 8 s sin
empezar): la capa se cierra sola y se reproduce `escenaRespaldo` como diálogo narrado con
`Dialogo`. El niño no ve ningún mensaje: la historia llega igual (reglas 4 y 8). Por eso cada
video necesita su escena de respaldo.

Con `prefers-reduced-motion`, el aro de carga no gira: late en opacidad (0,4 ↔ 1, 1 s). El
video se reproduce igual porque lo pide el niño al tocar ▶.

### 5.3 Formato y peso que debe pedir Manuel

Los videos **no** entran en la primera carga (regla 4). Se descargan solo cuando se van a ver,
con `preload="none"`, y el elemento `<video>` se crea solo al abrir la capa.

| Qué | Llegada a territorio | Cierre de camino |
| --- | --- | --- |
| Duración máxima | 25 s | 15 s |
| Peso máximo del archivo | 1,5 MB | 0,9 MB |
| Proporción | **1:1 (480 × 480)**, preferida para celular vertical. Si la herramienta solo da 16:9, 640 × 360. | igual |
| Video | H.264 (MP4), perfil Main, nivel 3.0, 24 cuadros/s, `yuv420p`, CRF 30 con tope de 350 kbps | igual |
| Audio | AAC-LC mono, 64 kbps, 44,1 kHz, volumen normalizado a −16 LUFS (igual que la voz) | igual |
| Contenedor | MP4 con `faststart` (empieza a sonar antes de bajar completo) | igual |
| Póster | WebP 480 × 480 (o 640 × 360), menos de 25 KB, un cuadro con los personajes | igual |

Por territorio: 1 llegada y 5 cierres son como mucho 6 MB, que solo se bajan si se ven.

**Por qué H.264 y no AV1 o VP9:** todos los celulares de gama baja lo decodifican con hardware.
AV1 pesa menos, pero en esos equipos se decodifica con el procesador: se calientan y el video
se entrecorta.

Manuel exporta de su herramienta lo mejor que dé, y el desarrollador lo convierte con un
guion en `herramientas/` (así a Manuel no le toca configurar nada):

```bash
# 1:1
ffmpeg -i entrada.mp4 -vf "scale=480:480:force_original_aspect_ratio=increase,crop=480:480,fps=24" \
  -c:v libx264 -profile:v main -level 3.0 -preset slow -crf 30 -maxrate 350k -bufsize 700k \
  -pix_fmt yuv420p -c:a aac -ac 1 -b:a 64k -ar 44100 -af loudnorm=I=-16 -movflags +faststart salida.mp4
# 16:9: cambiar el filtro por  scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2,fps=24
```

Sin conexión: los videos **no se guardan por adelantado** en el service worker. Guardar video
para verlo sin conexión exige manejar peticiones por partes (`Range`) y suma megas al
teléfono. Si no hay conexión, se usa la escena de respaldo.

---

## 6. Animaciones

Todas usan solo `transform` y `opacity`, salvo donde se indica. "Reducido" es lo que pasa con
`prefers-reduced-motion: reduce`.

| Nombre | Dónde | Duración | Se dispara | Reducido |
| --- | --- | --- | --- | --- |
| `entrar-carta` (existe) | Cartas de Memory en cascada, piezas del vestidor | 0,35 s, +40 ms por carta | Entrar al juego, poner una pieza | Fundido de opacidad 0,2 s |
| Giro de carta (`.carta__giro`, transición) | Memory | 0,42 s | Tocar una carta, volver boca abajo | Sin giro: el dorso se desvanece (opacidad 0,25 s) y se ve el frente |
| `celebrar` (existe) | Pareja, farolito atrapado, frasco lleno, regalo | 0,6 s / 0,3 s | Acierto | Ninguna; queda el cambio de color |
| Chispa a Lumi | Memory | 0,5 s | Pareja | No se muestra; el halo de Lumi sube igual |
| Halo de Lumi (opacidad) | Memory | 0,4 s | Cada pareja | Igual (ya es opacidad) |
| Cabeza de Lumi (−6°) | Memory | 0,4 s ida y vuelta | Pareja fallida | Ninguna |
| `brincar` (existe) | Pista de carta, Lumi que ayuda, manita del tutorial, héroe al vestirse | 0,9 s en bucle / 1 vez | Ayuda de nivel 1 a 3, poner pieza | Contorno de oro sin movimiento |
| `caer` (nueva) | Listen & Catch | 5,5 a 9 s, `linear` | Sale un farolito cada 1,6 s | Farolitos quietos (decidido en JS) |
| Vuelo al frasco | Listen & Catch | 0,45 s, `--rebote` | Atrapar el correcto | Fundido del farolito y subida del frasco |
| Subida de la luz del frasco | Listen & Catch | 0,4 s | Llega un farolito | Igual (es corta y la causa el niño) |
| `temblar` (existe) | Farolito equivocado, pieza cerrada | 0,4 s | Toque en lo que no era | Solo baja la opacidad |
| `latir` (existe) | Botón del vestidor con novedad, pista de farolito, ▶ del video, carta en pareja tocada | 1,6 s en bucle / 0,3 s | Pieza nueva, pista, póster | Sin movimiento |
| Aro de carga | Video | 1 s por vuelta | 300 ms sin empezar | Latido de opacidad |
| Fundido de la capa de video | Video | 0,3 s | Abrir y cerrar | Igual |
| Anillo de "mantener para borrar" | Familia | 2 s, lineal | Mantener presionado | Igual (es la confirmación) |

---

## 7. Sonidos

Los efectos son tonos sintetizados con `tono()` en `src/audio.ts`: **0 KB**. Se agregan al
tipo `Efecto`.

| Efecto | Para qué | Receta con `tono(frecuencia, inicio, duración, onda, volumen)` |
| --- | --- | --- |
| `girar` | Carta que gira | `tono(740,0,.06,'triangle',.06)`, `tono(980,.04,.06,'triangle',.05)` |
| `volver` | Cartas que vuelven boca abajo | `tono(500,0,.06,'sine',.04)` (muy bajo: no suena a error) |
| `pareja` | Pareja hecha | `tono(660,0,.1,'triangle')`, `tono(880,.08,.1,'triangle')`, `tono(1175,.16,.18,'triangle',.09)` |
| `atrapar` | Toque en el farolito correcto | `tono(880,0,.08,'triangle')`, `tono(1320,.06,.12,'triangle',.08)` |
| `frasco` | Luz que entra al frasco | `tono(523,0,.25,'sine',.08)`, `tono(784,.05,.3,'sine',.06)` |
| `vestir` | Ponerse una pieza | `tono(600,0,.07,'triangle')`, `tono(900,.05,.09,'triangle')` |
| `quitar` | Quitarse una pieza | `tono(700,0,.07,'sine',.06)`, `tono(480,.05,.09,'sine',.05)` |
| `regalo` | Abrir una pieza nueva | `[784, 988, 1175, 1568]` como `fiesta`, separadas 0,09 s |

Se reutilizan `toque`, `intenta` (solo en Listen & Catch; Memory no tiene sonido de error),
`fiesta` y `estrella`.

**Voz** (hoy `decir`; más adelante, archivos): cada palabra del vocabulario, más estas frases,
que van en el contenido (`cartilla.ayudas`) para que las revise el pedagogo:

| Clave | Español | English |
| --- | --- | --- |
| `memoria.tutorial` | ¡Iguales! Ahora tú. | They match! Your turn. |
| `memoria.pista1` | Escucha bien: cada dibujo tiene su palabra. | Listen: every picture has its word. |
| `memoria.pista2` | Mira, por aquí. | Look, over here. |
| `atrapa.inicio` | Atrapa la luz que te digo. | Catch the light I say. |
| `vestidor.cerrada` | ¡Pronto! Sigue encendiendo el bosque. | Soon! Keep lighting up the forest. |

---

## 8. Recursos gráficos que faltan

| Recurso | Tamaño del archivo | Peso máximo | Origen | ¿Bloquea? |
| --- | --- | --- | --- | --- |
| 6 accesorios del Bosque (bufanda, gafas de estrella, antena con luciérnaga, capa de hojas, corona de flores, mochila cohete) | 128 × 128 WebP con transparencia, de frente | 6 KB c/u | Canva, hoja sobre fondo blanco recortada con `herramientas/recortar.py`, usando a los héroes como referencia de estilo | Sí, para el vestidor (se puede probar antes con iconos Noto) |
| Anclas de cada héroe para las 4 ranuras | (datos, no imagen) | — | Las mide el desarrollador sobre `heroe-1/2/3.webp` | Sí |
| Frasco de vidrio con tapa de corcho, interior transparente | 208 × 240 WebP (se ve a 104 × 120) | 10 KB | Canva | No: la versión solo con CSS del boceto sirve para la primera entrega |
| Pósters de video | 480 × 480 (o 640 × 360) WebP | 25 KB c/u | Un cuadro del propio video | Sí, con cada video |
| Videos | ver 5.3 | 1,5 MB / 0,9 MB | Herramienta de Manuel + guion de conversión | No: sin video se usa la escena de respaldo |
| Dorso de carta, farolito, cielo de Listen & Catch, cinta de regalo | — | 0 KB | CSS | No |
| Lumi "pensando" (para la ayuda) | 200 × 188 WebP | 35 KB | Canva, desde las poses existentes | No: sirve `lumi-point.webp` |

---

## 9. Resumen de clases nuevas y cambios a lo existente

Nuevas: `.memoria`, `.memoria__tablero`, `.memoria__lumi`, `.carta`, `.carta__giro`,
`.carta__cara`, `.carta__dorso`, `.carta__frente`, `.es-boca-arriba`, `.es-pareja`,
`.es-pista`, `.escucha-atrapa`, `.escucha-atrapa--pausa`, `.farolito`, `.farolito__luz`,
`.frasco`, `.frasco__luz`, `.mision--noche`, `.familia`, `.familia__cabeza`, `.familia__lista`,
`.familia__chips`, `.familia__acciones`, `.familia__borrar`, `.familia__imprimir-solo`,
`.vestidor`, `.vestidor__escena`, `.vestidor__grilla`, `.vestidor__una`, `.guia__figura`,
`.guia__heroe`, `.guia__accesorio`, `.cine`, `.cine__marco`, `.cine__saltar`, `.cine__carga`,
`.cine__subtitulo`.

Reutilizadas tal cual: `.mision`, `.mision__barra`, `.boton-salir`, `.puntos`, `.punto*`,
`.oir`, `.oir__onda`, `.boton-jugar`, `.boton-seguir`, `.panel`, `.panel__caja`,
`.panel__cabeza`, `.panel__cerrar`, `.estelas`, `.estelas__una`, `.utiles`, `.enlace`,
`.chispa`, `.onda-toque`, `.cortina`, y las animaciones `entrar-carta`, `celebrar`, `brincar`,
`latir`, `temblar`, `flotar`, `respirar`, `trotar`.

Cambios a lo existente:

1. `respirar`, `trotar`, el filtro y el espejo pasan de `.guia img` a `.guia__figura` (4.3).
2. Las estelas se mudan del álbum al vestidor, y `.estelas__una` deja de usar `disabled` (4.4).
3. "Empezar de nuevo" sale del inicio y va al final del resumen para la familia, con
   confirmación de mantener presionado (3.1).
4. `Mision.plantilla` suma `'memoria'` y `'escucha-atrapa'`; `App.tsx` elige el componente por
   plantilla con un mapa, no con más `if`.
5. Contenido nuevo en `cartilla.json`: `accesorios`, `heroes[].anclas`, `videos`,
   `ayudas`, `mision.familia`, `mision.pares`. Como el bosque lo arma
   `herramientas/construir_bosque.py`, estos campos se escriben en ese guion.
