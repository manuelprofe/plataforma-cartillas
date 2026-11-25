// Ajusta dist/ para Cloudflare Pages (el sitio se publica ahí desde el 25 nov 2026, porque
// Netlify pausó las publicaciones al agotar los créditos gratis).
// Cloudflare trata el sitio como app de una sola página (cualquier ruta abre index.html)
// solo si no hay un 404.html en la raíz, y no acepta las reglas 404 de _redirects de Netlify.
// Por eso aquí se quitan los dos. Los encabezados de caché van en public/_headers.
import { rmSync } from 'node:fs';

for (const archivo of ['dist/404.html', 'dist/_redirects']) rmSync(archivo, { force: true });
console.log('dist listo para Cloudflare Pages');
