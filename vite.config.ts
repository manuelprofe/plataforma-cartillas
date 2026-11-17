import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TRAMOS } from './src/modos.ts';

/**
 * Medios que se guardan para jugar sin conexión cuando cartilla.json los nombra. Los videos no:
 * pesan mucho, se piden a la red solo cuando se van a ver y sin red hay una escena de respaldo.
 */
const MEDIOS = /\.(webp|avif|png|jpe?g|svg|gif|mp3|ogg|m4a|wav|vtt)$/i;

/** Lista todos los archivos bajo una carpeta, con rutas relativas a `raiz` y separador "/". */
function archivos(carpeta: string, raiz: string): string[] {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta, raiz) : [relative(raiz, ruta).split(sep).join('/')];
  });
}

/** SHA-256 del contenido, en hexadecimal, recortado. El service worker calcula la misma. */
const huellaDe = (contenido: Buffer | string) => createHash('sha256').update(contenido).digest('hex').slice(0, 16);

/**
 * Recorre todo el JSON y junta cualquier cadena que nombre un medio, sin importar el campo.
 * Devuelve ruta → campo donde apareció (para los mensajes de error). Una frase que termina
 * en ".png" no es una ruta: se ignoran las cadenas con espacios o con ":".
 */
function mediosDelJson(nodo: unknown, campo = '', salida = new Map<string, string>()): Map<string, string> {
  if (typeof nodo === 'string') {
    if (MEDIOS.test(nodo) && !/[\s:]/.test(nodo) && !nodo.startsWith('/') && !salida.has(nodo)) salida.set(nodo, campo);
  } else if (Array.isArray(nodo)) {
    nodo.forEach((n, i) => mediosDelJson(n, `${campo}[${i}]`, salida));
  } else if (nodo && typeof nodo === 'object') {
    Object.entries(nodo).forEach(([k, n]) => mediosDelJson(n, campo ? `${campo}.${k}` : k, salida));
  }
  return salida;
}

/**
 * Genera dist/sw.js a partir de sw/sw.js con la huella de cada archivo del armazón de la app
 * y de cada archivo que nombra cartilla.json. Escrito a mano para no agregar dependencias.
 */
function sinConexion(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'sin-conexion',
    apply: 'build',
    configResolved(c) {
      config = c;
    },
    closeBundle() {
      const salida = resolve(config.root, config.build.outDir);
      // Si la compilación falló no hay index: no se tapa el error verdadero con otro.
      if (!existsSync(join(salida, 'index.html'))) return;
      const leer = (ruta: string) => readFileSync(join(salida, ruta));
      const todos = archivos(salida, salida);

      // El index se guarda con la clave './' (la raíz de la app), nunca como index.html.
      const armazon: Record<string, string> = { './': huellaDe(leer('index.html')) };
      for (const ruta of todos) {
        const entra =
          ruta === 'manifest.webmanifest' ||
          ruta.startsWith('iconos-app/') ||
          /^assets\/.+\.(js|css)$/.test(ruta) ||
          // Solo la fuente latina; devanagari, vietnamese y latin-ext se piden si hacen falta.
          /^assets\/.*-latin-wght-.*\.woff2$/.test(ruta);
        if (entra) armazon[ruta] = huellaDe(leer(ruta));
      }

      // Nombre con hash del JS de entrada: el service worker acepta un index con algo
      // inyectado (filtro, CDN) si todavía carga este archivo.
      const entrada = /<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"/.exec(leer('index.html').toString('utf8'))?.[1];
      if (!entrada) throw new Error('No se encontró el script de entrada en dist/index.html.');

      const cartillas: Record<string, { version: string; archivos: Record<string, string>; instalar: string[] }> = {};
      for (const json of todos.filter((r) => /^cartillas\/[^/]+\/cartilla\.json$/.test(r))) {
        const dir = json.replace(/cartilla\.json$/, '');
        const datos = JSON.parse(leer(json).toString('utf8'));
        const lista: Record<string, string> = { 'cartilla.json': huellaDe(leer(json)) };
        const faltan: string[] = [];
        for (const [medio, campo] of mediosDelJson(datos)) {
          // La URL resuelve "../" y codifica tildes y eñes; se decodifica para leer el disco.
          const ruta = decodeURIComponent(new URL(medio, `http://x/${dir}`).pathname.slice(1));
          if (!ruta.startsWith(dir) || !existsSync(join(salida, ruta))) faltan.push(`"${medio}" (campo ${campo})`);
          else lista[ruta.slice(dir.length)] = huellaDe(leer(ruta));
        }
        if (faltan.length) throw new Error(`${json} nombra archivos que no están en el paquete: ${faltan.join('; ')}`);
        // Lo mínimo para abrir la portada sin red desde la primera instalación.
        const portada = typeof datos.imagenes?.portada === 'string' ? [datos.imagenes.portada] : [];
        cartillas[dir] = { version: huellaDe(JSON.stringify(lista)), archivos: lista, instalar: ['cartilla.json', ...portada] };
      }

      const plantilla = readFileSync(resolve(config.root, 'sw/sw.js'), 'utf8');
      const version = huellaDe(plantilla + JSON.stringify(armazon) + JSON.stringify(cartillas));
      const codigo = plantilla.replace('__CONFIG__', JSON.stringify({ version, entrada, armazon, cartillas }));
      writeFileSync(join(salida, 'sw.js'), codigo);
    },
  };
}

/**
 * main.tsx carga el paquete de cada modo bajo demanda. En las rutas del niño, el index pide
 * desde el principio el JS y el CSS de su paquete, en paralelo con la entrada, para que dividir
 * el código no le sume una espera a la primera pantalla del juego.
 */
function adelantarEstudiante(): Plugin {
  return {
    name: 'adelantar-estudiante',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const chunk = Object.values(bundle ?? {}).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('/src/estudiante.tsx'));
        if (!chunk || chunk.type !== 'chunk') throw new Error('No se encontró el paquete del estudiante.');
        const css = [...(chunk.viteMetadata?.importedCss ?? [])];
        const ajenas = new RegExp(`^/(${[...TRAMOS.adultos, ...TRAMOS.proyectar].join('|')})(/|$)`);
        const enlaces = [
          `['modulepreload','/${chunk.fileName}']`,
          ...css.map((c) => `['preload','/${c}','style']`),
        ];
        const guion =
          `if(!${ajenas}.test(location.pathname))[${enlaces.join(',')}]` +
          `.forEach(function(e){var l=document.createElement('link');l.rel=e[0];l.href=e[1];if(e[2])l.as=e[2];document.head.appendChild(l)})`;
        return html.replace('</head>', `  <script>${guion}</script>\n  </head>`);
      },
    },
  };
}

export default defineConfig({
  // Absoluta: con rutas como /docente/grupos/3B, una base relativa buscaría los archivos en
  // /docente/grupos/assets/. El sitio se publica en la raíz del dominio (ver netlify.toml).
  base: '/',
  plugins: [react(), adelantarEstudiante(), sinConexion()],
});
