import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Medios que se guardan para jugar sin conexión cuando cartilla.json los nombra. */
const MEDIOS = /\.(webp|avif|png|jpe?g|svg|gif|mp3|ogg|m4a|wav|webm|mp4|vtt)$/i;

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

/** Recorre todo el JSON y junta cualquier cadena que nombre un medio, sin importar el campo. */
function mediosDelJson(nodo: unknown, salida = new Set<string>()): Set<string> {
  if (typeof nodo === 'string') {
    if (MEDIOS.test(nodo) && !/^[a-z]+:/i.test(nodo) && !nodo.startsWith('/')) salida.add(nodo);
  } else if (Array.isArray(nodo)) {
    nodo.forEach((n) => mediosDelJson(n, salida));
  } else if (nodo && typeof nodo === 'object') {
    Object.values(nodo).forEach((n) => mediosDelJson(n, salida));
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

      const cartillas: Record<string, { version: string; archivos: Record<string, string> }> = {};
      for (const json of todos.filter((r) => /^cartillas\/[^/]+\/cartilla\.json$/.test(r))) {
        const dir = json.replace(/cartilla\.json$/, '');
        const lista: Record<string, string> = { 'cartilla.json': huellaDe(leer(json)) };
        const faltan: string[] = [];
        for (const medio of mediosDelJson(JSON.parse(leer(json).toString('utf8')))) {
          const ruta = new URL(medio, `http://x/${dir}`).pathname.slice(1);
          if (!existsSync(join(salida, ruta))) faltan.push(ruta);
          else lista[ruta.slice(dir.length)] = huellaDe(leer(ruta));
        }
        if (faltan.length) throw new Error(`${json} nombra archivos que no existen: ${faltan.join(', ')}`);
        cartillas[dir] = { version: huellaDe(JSON.stringify(lista)), archivos: lista };
      }

      const plantilla = readFileSync(resolve(config.root, 'sw/sw.js'), 'utf8');
      const version = huellaDe(plantilla + JSON.stringify(armazon) + JSON.stringify(cartillas));
      const codigo = plantilla.replace('__CONFIG__', JSON.stringify({ version, armazon, cartillas }));
      writeFileSync(join(salida, 'sw.js'), codigo);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), sinConexion()],
});
