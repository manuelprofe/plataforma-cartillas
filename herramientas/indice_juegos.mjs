// Escribe public/cartillas/juegos.json: la lista liviana de todos los juegos jugables de todas
// las cartillas, para la Sala de juegos del docente. Corre antes de cada compilación, así los
// juegos nuevos que traiga una cartilla aparecen solos. Sin vocabulario: solo títulos e iconos.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const RAIZ = 'public/cartillas';
const catalogo = JSON.parse(readFileSync(`${RAIZ}/catalogo.json`, 'utf8')).cartillas;
const cartillas = [];
for (const c of catalogo) {
  const archivo = `${RAIZ}/${c.id}/cartilla.json`;
  if (!existsSync(archivo)) continue;
  const datos = JSON.parse(readFileSync(archivo, 'utf8'));
  const juegos = [];
  datos.territorios.forEach((t, it) =>
    t.misiones.forEach((m) => {
      juegos.push({
        id: m.id,
        titulo: m.titulo,
        plantilla: m.plantilla,
        icono: m.icono,
        ...(m.familia?.tema ? { tema: m.familia.tema } : {}),
        lugar: t.nombre,
        periodo: it + 1,
        ...(m.palabrasDe ? { repaso: true } : {}),
      });
    }),
  );
  cartillas.push({ id: c.id, materia: c.materia, grado: c.grado, gradoNombre: c.gradoNombre, guia: c.guia, titulo: datos.titulo ?? c.titulo, juegos });
}
writeFileSync(`${RAIZ}/juegos.json`, JSON.stringify({ cartillas }) + '\n');
console.log(`juegos.json: ${cartillas.length} cartillas, ${cartillas.reduce((n, c) => n + c.juegos.length, 0)} juegos`);
