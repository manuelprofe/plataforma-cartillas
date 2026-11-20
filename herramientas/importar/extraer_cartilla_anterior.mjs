// Extrae SOLO el contenido (datos) de la cartilla anterior (manuelprofe/cartillaenglishadventure,
// index.html): misiones, actividades, recursos y niveles. No copia código. Uso:
//   node herramientas/importar/extraer_cartilla_anterior.mjs <ruta del index.html> <salida.json>
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const [entrada, salida] = process.argv.slice(2);
const html = readFileSync(entrada, 'utf8');
const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).sort((a, b) => b.length - a.length)[0];
function literal(nombre) {
  const i = js.search(new RegExp(`(?:const|let|var)\\s+${nombre}\\s*=\\s*[\\[{]`));
  if (i < 0) return undefined;
  let j = js.indexOf('=', i) + 1;
  while (/\s/.test(js[j])) j++;
  const abre = js[j], cierra = abre === '[' ? ']' : '}';
  let nivel = 0, k = j, cadena = null;
  for (; k < js.length; k++) {
    const c = js[k];
    if (cadena) { if (c === '\\') k++; else if (c === cadena) cadena = null; continue; }
    if (c === '"' || c === "'" || c === '`') { cadena = c; continue; }
    if (c === abre) nivel++;
    else if (c === cierra && --nivel === 0) break;
  }
  return vm.runInNewContext('(' + js.slice(j, k + 1) + ')');
}
const datos = {};
for (const n of ['MISSIONS', 'ACTIVITIES', 'RESOURCE_LEVELS', 'RESOURCE_TOPIC_VISUALS', 'resourcesData', 'activityTemplateLinks', 'topicResourceAliases', 'STYLE_LABELS']) datos[n] = literal(n);
writeFileSync(salida, JSON.stringify(datos, null, 1));
console.log(Object.entries(datos).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : v ? Object.keys(v).length : 'no'}`).join(' · '));
