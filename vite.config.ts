import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Lista todos los archivos bajo una carpeta, con rutas relativas a `raiz` y separador "/". */
function archivos(carpeta: string, raiz: string): string[] {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta, raiz) : [relative(raiz, ruta).split(sep).join('/')];
  });
}

function huella(rutas: string[], raiz: string, extra = ''): string {
  const h = createHash('sha256').update(extra);
  for (const ruta of [...rutas].sort()) h.update(ruta).update(readFileSync(join(raiz, ruta)));
  return h.digest('hex').slice(0, 12);
}

/**
 * Genera dist/sw.js a partir de sw/sw.js con la lista del armazón de la app y la versión
 * de cada paquete de cartilla. Escrito a mano para no agregar dependencias.
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
      const todos = archivos(salida, salida);
      const armazon = todos.filter(
        (ruta) =>
          ruta === 'index.html' ||
          ruta === 'manifest.webmanifest' ||
          ruta.startsWith('iconos-app/') ||
          /^assets\/.+\.(js|css)$/.test(ruta) ||
          // Solo la fuente latina; devanagari, vietnamese y latin-ext se piden si hacen falta.
          /^assets\/.*-latin-wght-.*\.woff2$/.test(ruta),
      );
      const cartillas: Record<string, string> = {};
      for (const ruta of todos.filter((r) => /^cartillas\/[^/]+\/cartilla\.json$/.test(r))) {
        const dir = ruta.replace(/cartilla\.json$/, '');
        cartillas[dir] = huella(todos.filter((r) => r.startsWith(dir)), salida);
      }
      const plantilla = readFileSync(resolve(config.root, 'sw/sw.js'), 'utf8');
      const version = huella(armazon, salida, plantilla + JSON.stringify(cartillas));
      const codigo = plantilla.replace('__CONFIG__', JSON.stringify({ version, armazon, cartillas }, null, 2));
      writeFileSync(join(salida, 'sw.js'), codigo);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), sinConexion()],
});
