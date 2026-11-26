// Planeador de clase en Word (.docx), con el mismo formato que en pantalla e impreso: membrete del
// colegio (escudo, nombre y colores), encabezado, referentes, momentos de la clase y pie. Se carga
// solo al tocar "Descargar en Word" (no pesa en la primera carga) y no usa librerías: arma el
// .docx (un zip de XML) a mano, sin comprimir, que Word, LibreOffice y Google Docs abren igual.
import type { IdentidadColegio } from '../adultos/docente';
import { COLOR_1, COLOR_2, tintaSobre } from '../adultos/Identidad';
import type { Bloque, Material } from './datos';
import { fases } from './Planeador';

type Momento = Extract<Bloque, { tipo: 'momento' }>;

export interface DatosWord {
  material: Material;
  nombreTema: string;
  docente?: string;
  colegio: string | null;
  identidad: IdentidadColegio | null;
  area?: string;
  grado?: string;
}

// ---------------------------------------------------------------- Zip sin compresión

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(d: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < d.length; i++) c = TABLA_CRC[(c ^ d[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(archivos: { nombre: string; datos: Uint8Array }[]): Uint8Array {
  const cod = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let desplazamiento = 0;
  for (const a of archivos) {
    const nombre = cod.encode(a.nombre);
    const crc = crc32(a.datos);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint16(8, 0, true); // sin compresión
    local.setUint32(14, crc, true);
    local.setUint32(18, a.datos.length, true);
    local.setUint32(22, a.datos.length, true);
    local.setUint16(26, nombre.length, true);
    partes.push(new Uint8Array(local.buffer), nombre, a.datos);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, a.datos.length, true);
    c.setUint32(24, a.datos.length, true);
    c.setUint16(28, nombre.length, true);
    c.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(c.buffer), nombre);
    desplazamiento += 30 + nombre.length + a.datos.length;
  }
  const largoCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, largoCentral, true);
  fin.setUint32(16, desplazamiento, true);
  const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
  const salida = new Uint8Array(todo.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of todo) {
    salida.set(p, i);
    i += p.length;
  }
  return salida;
}

// ---------------------------------------------------------------- Piezas de WordprocessingML

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hex = (c: string) => c.replace('#', '').toUpperCase();
interface Estilo {
  negrita?: boolean;
  color?: string;
  tam?: number; // medios puntos
}
function run(texto: string, e: Estilo = {}): string {
  const rpr = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${e.negrita ? '<w:b/>' : ''}${e.color ? `<w:color w:val="${hex(e.color)}"/>` : ''}<w:sz w:val="${e.tam ?? 17}"/></w:rPr>`;
  return `<w:r>${rpr}<w:t xml:space="preserve">${esc(texto)}</w:t></w:r>`;
}
/** Texto del contenido con **negritas** y *énfasis* (que se deja como texto normal). */
function runs(texto: string, e: Estilo = {}): string {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((t) => (t.startsWith('**') ? run(t.slice(2, -2), { ...e, negrita: true }) : run(t.replace(/\*([^*]+)\*/g, '$1'), e)))
    .join('');
}
function parrafo(contenido: string, opciones: { antes?: number; despues?: number; alinear?: 'center' } = {}): string {
  return `<w:p><w:pPr><w:spacing w:before="${opciones.antes ?? 0}" w:after="${opciones.despues ?? 40}"/>${opciones.alinear ? `<w:jc w:val="${opciones.alinear}"/>` : ''}</w:pPr>${contenido}</w:p>`;
}
const vacioP = () => parrafo('', { despues: 0 });
const raya = () => `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="888888"/></w:pBdr><w:spacing w:before="200" w:after="0"/></w:pPr></w:p>`;

interface Celda {
  contenido: string; // párrafos ya armados
  ancho: number; // twips
  fondo?: string;
  combinar?: 'empieza' | 'sigue';
  columnas?: number;
}
function celda(c: Celda): string {
  const pr = `<w:tcPr><w:tcW w:w="${c.ancho}" w:type="dxa"/>${c.columnas ? `<w:gridSpan w:val="${c.columnas}"/>` : ''}${c.combinar ? `<w:vMerge${c.combinar === 'empieza' ? ' w:val="restart"' : ''}/>` : ''}${c.fondo ? `<w:shd w:val="clear" w:color="auto" w:fill="${hex(c.fondo)}"/>` : ''}</w:tcPr>`;
  return `<w:tc>${pr}${c.contenido || vacioP()}</w:tc>`;
}
function tabla(anchos: number[], filas: string[], opciones: { borde?: string; sinBordes?: boolean } = {}): string {
  const b = opciones.sinBordes ? 'nil' : 'single';
  const color = hex(opciones.borde ?? '#555555');
  const bordes = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((l) => `<w:${l} w:val="${b}" w:sz="4" w:space="0" w:color="${color}"/>`).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${anchos.reduce((a, x) => a + x, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${bordes}</w:tblBorders><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${anchos.map((a) => `<w:gridCol w:w="${a}"/>`).join('')}</w:tblGrid>${filas.join('')}</w:tbl>`;
}
const fila = (celdas: string, encabezado = false) => `<w:tr><w:trPr><w:cantSplit/>${encabezado ? '<w:tblHeader/>' : ''}</w:trPr>${celdas}</w:tr>`;

// ---------------------------------------------------------------- El planeador

const ANCHO = 11520; // carta con márgenes de 1,27 cm: 8,5 in − 2 × 0,5 in, en twips
const NOMBRE_FASE = { inicio: 'Inicio', desarrollo: 'Desarrollo', cierre: 'Cierre' } as const;

function partes(m: Momento) {
  const r = /^\*\*(.+?)\*\*\s*(.*)$/.exec(m.momento);
  return r ? { titulo: r[1].replace(/[.:]$/, ''), cuerpo: r[2] } : { titulo: m.momento, cuerpo: '' };
}
const vacio = (m: Momento) => !partes(m).cuerpo && !m.material && !m.observar && !m.sinProyector;

/** Ancho y alto del PNG (cabecera IHDR). */
function medidasPng(d: Uint8Array): [number, number] {
  const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
  return [v.getUint32(16), v.getUint32(20)];
}
function base64(data: string): Uint8Array {
  const b = atob(data.slice(data.indexOf(',') + 1));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}

function imagen(ancho: number, alto: number): string {
  const lado = 640080; // 1,78 cm en EMU
  const k = lado / Math.max(ancho, alto);
  const cx = Math.round(ancho * k);
  const cy = Math.round(alto * k);
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Escudo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="escudo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdEscudo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

export function documentoPlaneador(d: DatosWord, escudo: Uint8Array | null): string {
  const { material } = d;
  const c1 = d.identidad?.color_1 ?? COLOR_1;
  const c2 = d.identidad?.color_2 ?? COLOR_2;
  const ref = material.referentes ?? {};
  const momentos = material.bloques.filter((b): b is Momento => b.tipo === 'momento');
  const fase = fases(momentos);
  const filas = momentos.map((m, i) => ({ m, fase: fase[i] })).filter(({ m }) => !vacio(m));
  const transiciones = momentos.filter(vacio).reduce((a, m) => a + m.minutos, 0);
  const total = momentos.reduce((a, m) => a + m.minutos, 0);
  const etiqueta = (t: string) => parrafo(run(t, { negrita: true, tam: 14, color: '#555555' }), { despues: 0 });
  const valor = (t?: string | null) => (t ? parrafo(runs(t)) : raya());
  const lista = (items?: string[]) => (items?.length ? items.map((t) => parrafo(runs(items.length > 1 ? `• ${t}` : t))).join('') : parrafo(run('Por definir en la malla de la cartilla', { color: '#777777' })));

  // Membrete: escudo | nombre del colegio y título, con la raya del color de acento.
  const membrete = tabla(
    [1300, ANCHO - 1300],
    [
      fila(
        celda({ ancho: 1300, contenido: escudo ? parrafo(imagen(...medidasPng(escudo)), { alinear: 'center' }) : parrafo(run('Escudo', { color: '#888888' }), { alinear: 'center' }) }) +
          celda({ ancho: ANCHO - 1300, contenido: parrafo(run(d.colegio || 'Institución educativa', { negrita: true, color: c1, tam: 28 }), { antes: 60 }) + parrafo(run('Planeador de clase', { negrita: true, tam: 20, color: '#444444' })) }),
      ),
    ],
    { sinBordes: true },
  );
  const franja = `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="24" w:space="1" w:color="${hex(c2)}"/></w:pBdr><w:spacing w:before="0" w:after="120"/></w:pPr></w:p>`;

  const q = ANCHO / 4;
  const cab = (pares: [string, string | undefined | null][]) => pares.map(([e, v]) => celda({ ancho: q, contenido: etiqueta(e) + valor(v) })).join('');
  const duracion = `${total} min${transiciones ? ` (incluye ${transiciones} de transiciones)` : ''}`;
  const encabezado = tabla(
    [q, q, q, q],
    [
      fila(cab([['Institución', d.colegio], ['Docente', d.docente], ['Área', d.area], ['Grado', d.grado]])),
      fila(cab([['Grupo', null], ['Fecha', null], ['Tema', d.nombreTema], ['Duración', duracion]])),
      fila(celda({ ancho: ANCHO, columnas: 4, contenido: etiqueta('Clase') + valor(material.titulo) })),
    ],
  );

  const rot = 2600;
  const filaRef = (t: string, contenido: string) => fila(celda({ ancho: rot, fondo: '#EEEEEE', contenido: parrafo(run(t, { negrita: true })) }) + celda({ ancho: ANCHO - rot, contenido }));
  const referentes = tabla([rot, ANCHO - rot], [filaRef('DBA', lista(ref.dba)), filaRef('Estándares (EBC)', lista(ref.ebc)), filaRef('Desempeños', lista(ref.desempenos))]);

  // Momentos: el nombre de la fase combina sus filas, como en pantalla.
  const col = [1200, 700, 3820, 2200, 1900, 1700];
  const tinta = tintaSobre(c1);
  const cabeza = fila(['Momento', 'Tiempo', 'Actividades', 'Recursos', 'Evaluación: qué observar', 'Sin proyector'].map((t, i) => celda({ ancho: col[i], fondo: c1, contenido: parrafo(run(t, { negrita: true, color: tinta, tam: 16 })) })).join(''), true);
  const cuerpo = filas.map(({ m, fase: f }, i) => {
    const nueva = i === 0 || filas[i - 1].fase !== f;
    const { titulo, cuerpo: texto } = partes(m);
    const recursos = [...(m.enlaces ?? []).map((e) => `[${e.texto}]`), m.material].filter(Boolean).join(' ');
    return fila(
      celda({ ancho: col[0], fondo: f === 'inicio' ? '#E3EEFB' : f === 'cierre' ? '#E4F3E8' : '#FBE3EA', combinar: nueva ? 'empieza' : 'sigue', contenido: nueva ? parrafo(run(NOMBRE_FASE[f], { negrita: true, tam: 18 })) : vacioP() }) +
        celda({ ancho: col[1], contenido: parrafo(run(`${m.minutos} min`, { negrita: true })) }) +
        celda({ ancho: col[2], contenido: parrafo(run(titulo, { negrita: true }) + (texto ? run('. ') + runs(texto) : '')) }) +
        celda({ ancho: col[3], contenido: parrafo(runs(recursos)) }) +
        celda({ ancho: col[4], contenido: parrafo(runs(m.observar ?? '')) }) +
        celda({ ancho: col[5], contenido: parrafo(runs(m.sinProyector ?? '', { color: '#333333' })) }),
    );
  });
  const clase = tabla(col, [cabeza, ...cuerpo]);

  const observaciones = material.bloques.filter((b): b is Extract<Bloque, { tipo: 'parrafo' }> => b.tipo === 'parrafo');
  const notas = material.bloques.find((b): b is Extract<Bloque, { tipo: 'nota' }> => b.tipo === 'nota');
  const pie = tabla(
    [rot, ANCHO - rot],
    [
      ...(observaciones.length ? [filaRef('Observaciones', observaciones.map((o) => parrafo(runs(o.texto))).join(''))] : []),
      filaRef('Adaptaciones (ritmos y necesidades educativas)', raya()),
      filaRef(notas?.etiqueta ?? 'Notas del docente', raya() + raya()),
      filaRef('Firma del docente', raya()),
    ],
  );

  const titulo = (t: string) => parrafo(run(t, { negrita: true, tam: 22, color: c1 }), { antes: 160, despues: 60 });
  const fuente = ref.fuente ? parrafo(run(`Fuente: ${ref.fuente}`, { tam: 14, color: '#555555' })) : '';
  const cuerpoDoc = [membrete, franja, encabezado, vacioP(), referentes, fuente, titulo('Momentos de la clase'), clase, vacioP(), pie].join('');
  const seccion = `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="360" w:bottom="720" w:left="360" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${cuerpoDoc}${seccion}</w:body></w:document>`;
}

export function docxPlaneador(d: DatosWord): Uint8Array {
  const cod = new TextEncoder();
  const escudo = d.identidad?.escudo ? base64(d.identidad.escudo) : null;
  const tipos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const relsDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${escudo ? '<Relationship Id="rIdEscudo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/escudo.png"/>' : ''}</Relationships>`;
  const archivos: { nombre: string; datos: Uint8Array }[] = [
    { nombre: '[Content_Types].xml', datos: cod.encode(tipos) },
    { nombre: '_rels/.rels', datos: cod.encode(rels) },
    { nombre: 'word/document.xml', datos: cod.encode(documentoPlaneador(d, escudo)) },
    { nombre: 'word/_rels/document.xml.rels', datos: cod.encode(relsDoc) },
  ];
  if (escudo) archivos.push({ nombre: 'word/media/escudo.png', datos: escudo });
  return zip(archivos);
}

/** Nombre del archivo: "Planeador - Útiles escolares - Clase 1.docx". */
const nombreArchivo = (d: DatosWord) => `Planeador - ${d.nombreTema} - ${d.material.titulo}`.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) + '.docx';

export function descargarPlaneador(d: DatosWord) {
  const blob = new Blob([docxPlaneador(d) as Uint8Array<ArrayBuffer>], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo(d);
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
