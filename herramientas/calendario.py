#!/usr/bin/env python3
"""Calendario de trabajo de diciembre: 6 h diarias en tres bloques de 2 h, lunes a viernes.

Genera `docs/plan/calendario-diciembre.md` (legible) y `docs/plan/calendario-diciembre.ics`
(para importar en Google Calendar, con aviso 10 min antes de cada cambio de tema).
Uso: python3 -I herramientas/calendario.py
"""
from datetime import date, timedelta
from pathlib import Path

from calendario_detalle import detalle, texto_plano

RAIZ = Path(__file__).resolve().parent.parent
BLOQUES = [('08:00', '10:00'), ('10:30', '12:30'), ('14:00', '16:00')]  # hora de Colombia (UTC-5)
LIBRES = {date(2026, 12, 8), date(2026, 12, 24), date(2026, 12, 25)}  # festivos y Nochebuena

# ---------------------------------------------------------------- Fase 1: plataforma (23 nov – 4 dic)
PLATAFORMA = {
    date(2026, 11, 23): ['Multicartilla: catálogo por materia y grado, grupo con su cartilla, registrar_mision idempotente (migración 004)',
                         'Multicartilla: quitar ingles-3 fijo de App.tsx, docente.ts y datos.ts',
                         'Multicartilla en el estudiante: el código del grupo lleva a su cartilla'],
    date(2026, 11, 24): ['Multicartilla en el docente: Planear, Biblioteca y Proyectar según el grupo',
                         'Dueño: crear colegios y publicar cartillas',
                         'Coordinador: docentes y grupos'],
    date(2026, 11, 25): ['Coordinador: uso y avance por grado y grupo',
                         'Plantilla de juego: contar y tocar (matemáticas)',
                         'Plantilla de juego: ordenar (números y secuencias)'],
    date(2026, 11, 26): ['Plantilla de juego: completar la operación',
                         'Plantilla de juego: armar la sílaba o la palabra (español)',
                         'DiBrilla para leer en voz alta en español'],
    date(2026, 11, 27): ['Pruebas de las plantillas en celular de gama baja', 'Tanda 5: plan por grupo', None],
    date(2026, 11, 30): ['Tanda 6: avance y prueba del tema',
                         'Pantalla de canciones con letra sincronizada (estudiante)',
                         'Registro del piloto (docente)'],
    date(2026, 12, 1): ['Materiales de inglés 3: cuerpo', 'Materiales de inglés 3: familia', 'Materiales de inglés 3: hora'],
    date(2026, 12, 2): ['Rehacer las manos de números (Canva)',
                        'Deudas: regla 1, tecla Espacio, solo:"docente", correos en español, carrera de docente.mjs',
                        'Formato de cartilla documentado y generador de paquetes (nueva_cartilla.py)'],
    date(2026, 12, 3): ['Revisor: revisión de todo lo nuevo', 'Correcciones del revisor',
                        'Auditor: peso, sin conexión, accesibilidad, seguridad por filas y datos de menores'],
    date(2026, 12, 4): ['Correcciones de la auditoría',
                        'Unir la rama con main (con permiso), publicar y probar en Android real',
                        'Cierre de la plataforma: revisión semanal, CONTINUAR.md y guía docente al día'],
    date(2026, 12, 7): ['Mallas de inglés transición a 5.° (currículo sugerido y DBA del MEN)',
                        'Mallas de español transición a 5.° (DBA de Lenguaje)',
                        'Mallas de matemáticas transición a 5.° (DBA de Matemáticas)'],
    date(2026, 12, 9): ['Universos y guías de español y matemáticas (mundos, personajes)',
                        'Generar los 17 paquetes de cartilla y plan de audio (Kokoro borradores, ElevenLabs guías)',
                        None],
}
REVISION = 'Revisión semanal: probar en celular a 390 px, actualizar CONTINUAR.md y publicar (con permiso)'

# ---------------------------------------------------------------- Fase 2: cartillas (10 – 30 dic)
GRADOS = ['transición', '1.°', '2.°', '3.°', '4.°', '5.°']
MATERIAS = ['inglés', 'español', 'matemáticas']
cartillas = []
for i, g in enumerate(GRADOS):
    for m in MATERIAS:
        if (m, g) == ('inglés', '3.°'):
            continue  # ya existe
        cartillas += [f'{m.capitalize()} {g}: contenido del territorio 1 (misiones, banco de ítems, Mission Stars)',
                      f'{m.capitalize()} {g}: materiales del docente del periodo 1 (guía, planeador, láminas, fichas, prueba)']
    if i % 2 == 1:
        par = f'{GRADOS[i - 1]} y {g}'
        cartillas.append(f'Audio e imágenes de {par} (las tres materias)')


def dias(desde, hasta):
    d = desde
    while d <= hasta:
        if d.weekday() < 5 and d not in LIBRES:
            yield d
        d += timedelta(days=1)


def plan():
    """Fase 1 fija; los huecos libres de la fase 1 y toda la fase 2 se llenan con las cartillas en orden.
    Los viernes por la tarde son de revisión; el último bloque es el cierre."""
    pendientes = list(cartillas)
    filas = []
    todos = list(dias(date(2026, 11, 23), date(2026, 12, 30)))
    for d in todos:
        temas = []
        for k in range(3):
            fijo = PLATAFORMA.get(d, [None] * 3)[k] if d in PLATAFORMA else None
            if fijo:
                temas.append(fijo)
            elif d == todos[-1] and k == 2:
                temas.append('Cierre de diciembre: prueba en celular de 4.° y 5.°, publicar, CONTINUAR.md y plan de enero')
            elif k == 2 and d.weekday() == 4:
                temas.append(REVISION)
            else:
                temas.append(pendientes.pop(0) if pendientes else 'Colchón: terminar lo atrasado')
        filas.append((d, temas))
    assert not pendientes, f'No caben {len(pendientes)} bloques'
    return filas


MESES = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']


def ics_texto(s):
    return s.replace('\\', '\\\\').replace(',', '\\,').replace(';', '\\;')


def plegar(linea):
    """RFC 5545: líneas de máximo 75 octetos; las siguientes empiezan con un espacio."""
    trozos, actual = [], b''
    for c in linea:
        b = c.encode('utf-8')
        if len(actual) + len(b) > (75 if not trozos else 74):
            trozos.append(actual.decode('utf-8')); actual = b''
        actual += b
    trozos.append(actual.decode('utf-8'))
    return '\r\n '.join(trozos)


def main():
    filas = plan()
    md = ['# Calendario de trabajo: noviembre y diciembre de 2026', '',
          'Seis horas diarias, de lunes a viernes, en tres bloques de 2 horas (hora de Colombia):',
          '08:00–10:00, 10:30–12:30 y 14:00–16:00. Son libres los fines de semana, el 8 de diciembre, el 24 y el 25.',
          'Cada bloque es un tema; el aviso llega 10 minutos antes del cambio. Generado con',
          '`herramientas/calendario.py`; el archivo para Google Calendar es `calendario-diciembre.ics`.',
          'Ya está cargado en el calendario principal de Manuel: 75 eventos con el prefijo «Cartillas ·», en',
          'azul la plataforma, en verde las cartillas y en amarillo las revisiones de los viernes (aviso emergente 10 min antes).', '',
          '- **Plataforma:** del 23 de noviembre al 4 de diciembre.',
          '- **Cartillas:** del 7 al 30 de diciembre; cada una queda en su versión 1 (malla completa, territorio 1',
          '  jugable, materiales del periodo 1).', '',
          '| Día | 08:00–10:00 | 10:30–12:30 | 14:00–16:00 |', '| --- | --- | --- | --- |']
    for d, t in filas:
        md.append(f'| {DIAS[d.weekday()]} {d.day} {MESES[d.month]} | ' + ' | '.join(t) + ' |')
    md += ['', '## Qué se hace en cada bloque', '']
    for d, t in filas:
        md.append(f'### {DIAS[d.weekday()]} {d.day} {MESES[d.month]}')
        md.append('')
        for (ini, fin), tema in zip(BLOQUES, t):
            prop, pasos, listo = detalle(tema)
            md.append(f'**{ini}–{fin} · {tema}**  ')
            md.append(f'Propósito: {prop}')
            md += [f'- {x}' for x in pasos]
            md.append(f'- *Listo cuando:* {listo}')
            md.append('')
    md += ['## Riesgos', '',
           '- **Alcance:** 17 cartillas completas no caben en un mes. Por eso en diciembre se hace la versión 1 de',
           '  cada una y los territorios 2 a 4 quedan para enero y febrero.',
           '- **Créditos de ElevenLabs:** 40.000 al mes no alcanzan para la voz de 17 cartillas. Los borradores se',
           '  hacen con Kokoro, que es local y gratis, y ElevenLabs se reserva para los guías y las frases clave.',
           '  Otra opción es subir de plan solo en diciembre.',
           '- **Validación pedagógica:** las mallas y los contenidos de español y matemáticas necesitan una',
           '  revisión de Manuel o de un docente de cada área antes del piloto.']
    (RAIZ / 'docs/plan/calendario-diciembre.md').write_text('\n'.join(md) + '\n', encoding='utf-8')

    ev = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//plataforma-cartillas//calendario//ES', 'CALSCALE:GREGORIAN',
          'X-WR-CALNAME:Plataforma de cartillas', 'X-WR-TIMEZONE:America/Bogota']
    for d, temas in filas:
        for k, (tema, (ini, fin)) in enumerate(zip(temas, BLOQUES)):
            def utc(h):
                hh, mm = map(int, h.split(':'))
                return f'{d:%Y%m%d}T{hh + 5:02d}{mm:02d}00Z'
            ev += ['BEGIN:VEVENT', f'UID:cartillas-{d:%Y%m%d}-{k}@plataforma-cartillas', 'DTSTAMP:20261121T120000Z',
                   f'DTSTART:{utc(ini)}', f'DTEND:{utc(fin)}', f'SUMMARY:{ics_texto(tema)}',
                   f'DESCRIPTION:{ics_texto(texto_plano(tema)).replace(chr(10), chr(92) + "n")}',
                   'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT10M', f'DESCRIPTION:{ics_texto("Cambio de tema: " + tema)}',
                   'END:VALARM', 'END:VEVENT']
    ev.append('END:VCALENDAR')
    ev = [plegar(l) for l in ev]
    (RAIZ / 'docs/plan/calendario-diciembre.ics').write_text('\r\n'.join(ev) + '\r\n', encoding='utf-8')
    print(f'{len(filas)} días, {sum(len(t) for _, t in filas)} bloques')


if __name__ == '__main__':
    main()
