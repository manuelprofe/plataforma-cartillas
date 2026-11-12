---
name: auditoria
description: Procedimiento para auditar la plataforma de cartillas en ejecución: peso, velocidad, uso en celular, accesibilidad, funcionamiento sin conexión y privacidad de datos de menores. Cárgala antes de publicar o de un piloto en aula.
---

# Auditoría de la plataforma

Se audita lo que corre en el navegador. Cada punto termina en un número o una captura.
Usa la skill `webapp-testing` para levantar el servidor y manejar el navegador.

## 1. Peso y velocidad

1. Compila en modo producción y sirve el resultado.
2. Con Playwright, carga la entrada del modo estudiante con caché vacía y suma
   `transferSize` de todas las peticiones. Umbral: menos de 2 MB.
3. Entra a cada juego y repite. Umbral: menos de 1 MB adicional por juego.
4. Lista todo recurso de más de 200 KB con su tamaño y dónde se usa.
5. Simula red lenta (1,6 Mbps de bajada, 150 ms de latencia) y mide el tiempo hasta que el
   primer botón responde. Umbral: menos de 5 s.

## 2. Celular

Con un viewport de 390 × 780 táctil:

- `document.documentElement.scrollWidth` no supera el ancho: sin scroll horizontal.
- Mide con `getBoundingClientRect` todos los botones y fichas: 48 px mínimo.
- Nada depende de `hover` ni de teclado.
- Repite a 768 px y a 1280 px y mira las capturas.

## 3. Recorrido sin leer

Completa una misión entera tocando solo por lo que se ve y se oye. Anota cada punto donde
hizo falta leer para saber qué hacer.

## 4. Sin conexión

Tras una primera visita, corta la red y recarga. El mapa y las misiones ya visitadas deben
abrir, y el progreso hecho sin red debe conservarse al volver la conexión.

## 5. Accesibilidad

- Contraste de texto 4,5:1 o más (3:1 para texto grande).
- Todo control es alcanzable con teclado y muestra el foco.
- Con `prefers-reduced-motion: reduce` no hay desplazamientos ni rebotes.
- Imágenes con significado tienen texto alternativo; todo audio tiene equivalente visual.

## 6. Privacidad de menores

- Lista cada dato que se guarda de un estudiante y dónde. Debe ser solo nombre o apodo,
  grupo y progreso.
- Revisa las peticiones de red durante una sesión de estudiante: ningún dato sale a
  terceros, no hay rastreadores ni fuentes o scripts que delaten al usuario.
- Si hay micrófono: se pide permiso solo al usarlo y no se sube ni se guarda audio.
- Un estudiante no puede ver datos de otro; un docente no ve grupos ajenos; nadie ve datos
  de otro colegio. Pruébalo cambiando identificadores en las peticiones.

## 7. Seguridad y limpieza

- Busca claves y direcciones privadas en el repositorio y en el paquete compilado.
- Revisa las cabeceras de seguridad del sitio publicado y que no bloqueen funciones propias.
- Durante todo el recorrido, la consola no muestra errores ni peticiones fallidas.
- En el modo estudiante no aparece texto técnico: nombres de variables, modos, identificadores.

## Informe

Tabla con área, resultado medido, cumple o no cumple y evidencia. Lo no medido se declara
como no medido. Cierra con la lista de correcciones obligatorias antes de publicar.
