#!/usr/bin/env python3
"""Calendario de trabajo de diciembre: 6 h diarias en tres bloques de 2 h, lunes a sábado.

Genera `docs/plan/calendario-diciembre.md` (legible) y `docs/plan/calendario-diciembre.ics`
(para importar en Google Calendar, con aviso 10 min antes de cada cambio de tema).
Uso: python3 -I herramientas/calendario.py
"""
from datetime import date, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BLOQUES = [('08:00', '10:00'), ('10:30', '12:30'), ('14:00', '16:00')]  # hora de Colombia (UTC-5)
LIBRES = {date(2026, 12, 8), date(2026, 12, 24), date(2026, 12, 25)}  # festivos y Nochebuena

# ---------------------------------------------------------------- Fase 1: plataforma (23 nov – 5 dic)
PLATAFORMA = {
    date(2026, 11, 23): ['Multicartilla: catálogo por materia y grado, grupo con su cartilla (migración 004)',
                         'Multicartilla: quitar ingles-3 fijo de App.tsx, docente.ts y datos.ts',
                         'registrar_mision idempotente (en la migración 004) y prueba local'],
    date(2026, 11, 24): ['Multicartilla en el estudiante: el código del grupo lleva a su cartilla',
                         'Multicartilla en el docente: Planear, Biblioteca y Proyectar según el grupo',
                         'Pruebas a 390 px y commit'],
    date(2026, 11, 25): ['Dueño: crear colegios y publicar cartillas',
                         'Coordinador: docentes y grupos',
                         'Coordinador: uso y avance por grado y grupo'],
    date(2026, 11, 26): ['Plantilla de juego: contar y tocar (matemáticas)',
                         'Plantilla de juego: ordenar (números y secuencias)',
                         'Plantilla de juego: completar la operación'],
    date(2026, 11, 27): ['Plantilla de juego: armar la sílaba o la palabra (español)',
                         'DiBrilla para leer en voz alta en español',
                         'Pruebas de las plantillas en celular de gama baja'],
    date(2026, 11, 28): ['Tanda 5: plan por grupo', 'Tanda 6: avance y prueba del tema', None],
    date(2026, 11, 30): ['Pantalla de canciones con letra sincronizada (estudiante)',
                         'Registro del piloto (docente)',
                         'Deudas: regla 1 en Proyectar y datos.ts, tecla Espacio, solo:"docente"'],
    date(2026, 12, 1): ['Materiales de inglés 3: cuerpo', 'Materiales de inglés 3: familia', 'Materiales de inglés 3: hora'],
    date(2026, 12, 2): ['Rehacer las manos de números (Canva)',
                        'Correos de Supabase en español y carrera de docente.mjs',
                        'Formato de cartilla documentado y generador de paquetes (nueva_cartilla.py)'],
    date(2026, 12, 3): ['Revisor: revisión de todo lo nuevo', 'Correcciones del revisor', 'Correcciones del revisor'],
    date(2026, 12, 4): ['Auditor: peso, sin conexión, accesibilidad', 'Auditor: seguridad por filas y datos de menores',
                        'Correcciones de la auditoría'],
    date(2026, 12, 5): ['Unir la rama con main (con permiso) y publicar', 'Prueba en Android real: micrófono y modo avión',
                        'Cierre de la plataforma: CONTINUAR.md y guía docente al día'],
    date(2026, 12, 7): ['Mallas de inglés transición a 5.° (currículo sugerido y DBA del MEN)',
                        'Mallas de español transición a 5.° (DBA de Lenguaje)',
                        'Mallas de matemáticas transición a 5.° (DBA de Matemáticas)'],
    date(2026, 12, 9): ['Universos y guías de español y matemáticas (mundos, personajes)',
                        'Generar los 17 paquetes de cartilla vacíos',
                        'Plan de audio e imágenes: Kokoro para borradores, ElevenLabs para guías (cuidar créditos)'],
}
REVISION = 'Revisión semanal: probar a 390 px, actualizar CONTINUAR.md y publicar (con permiso)'

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
        cartillas += [f'Audio e imágenes de {par} (las tres materias)', f'Audio e imágenes de {par}: revisión',
                      f'Prueba de las cartillas de {par} en celular']


def dias(desde, hasta):
    d = desde
    while d <= hasta:
        if d.weekday() != 6 and d not in LIBRES:
            yield d
        d += timedelta(days=1)


def plan():
    filas = []
    for d in dias(date(2026, 11, 23), date(2026, 12, 9)):
        temas = PLATAFORMA[d]
        filas.append((d, [t or REVISION for t in temas]))
    pendientes = list(cartillas)
    ultimos = list(dias(date(2026, 12, 10), date(2026, 12, 30)))
    for d in ultimos:
        temas = []
        for k in range(3):
            if k == 2 and d.weekday() == 5:
                temas.append(REVISION)
            elif d == ultimos[-1] and k == 2:
                temas.append('Cierre de diciembre: publicar, CONTINUAR.md y plan de enero (territorios 2 a 4)')
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
          'Seis horas diarias, de lunes a sábado, en tres bloques de 2 horas (hora de Colombia):',
          '08:00–10:00, 10:30–12:30 y 14:00–16:00. Son libres los domingos, el 8 de diciembre, el 24 y el 25.',
          'Cada bloque es un tema; el aviso llega 10 minutos antes del cambio. Generado con',
          '`herramientas/calendario.py`; el archivo para Google Calendar es `calendario-diciembre.ics`.',
          'Ya está cargado en el calendario principal de Manuel: 90 eventos con el prefijo «Cartillas ·», en',
          'azul la plataforma, en verde las cartillas y en amarillo las revisiones (aviso emergente 10 min antes).', '',
          '- **Plataforma:** del 23 de noviembre al 5 de diciembre.',
          '- **Cartillas:** del 7 al 30 de diciembre; cada una queda en su versión 1 (malla completa, territorio 1',
          '  jugable, materiales del periodo 1).', '',
          '| Día | 08:00–10:00 | 10:30–12:30 | 14:00–16:00 |', '| --- | --- | --- | --- |']
    for d, t in filas:
        md.append(f'| {DIAS[d.weekday()]} {d.day} {MESES[d.month]} | ' + ' | '.join(t) + ' |')
    md += ['', '## Riesgos', '',
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
                   f'DESCRIPTION:{ics_texto("Bloque " + str(k + 1) + " de 3. Plan completo: docs/plan/calendario-diciembre.md")}',
                   'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT10M', f'DESCRIPTION:{ics_texto("Cambio de tema: " + tema)}',
                   'END:VALARM', 'END:VEVENT']
    ev.append('END:VCALENDAR')
    ev = [plegar(l) for l in ev]
    (RAIZ / 'docs/plan/calendario-diciembre.ics').write_text('\r\n'.join(ev) + '\r\n', encoding='utf-8')
    print(f'{len(filas)} días, {sum(len(t) for _, t in filas)} bloques')


if __name__ == '__main__':
    main()
