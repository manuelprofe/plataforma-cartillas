"""Propósito, pasos y criterio de terminado de cada bloque del calendario (lo usa calendario.py)."""

# título del bloque -> (propósito, pasos, listo cuando)
FIJOS = {
    'Multicartilla: catálogo por materia y grado, grupo con su cartilla, registrar_mision idempotente (migración 004)': (
        'Que la base de datos sepa qué cartillas existen y cuál usa cada grupo.',
        ['Escribir supabase/migraciones/004: tabla cartillas (id, materia, grado, título, publicada).',
         'Agregar grupos.cartilla_id (inglés 3 por defecto para los grupos que ya existen).',
         'registrar_mision con identificador de envío, para que un reintento no sume dos veces.',
         'Probar en local con supabase/prueba_local.sql y escribir los pasos para Manuel.'],
        'La migración 004 pasa la prueba local y está en PASOS-MANUEL.md lista para aplicar.'),
    'Multicartilla: quitar ingles-3 fijo de App.tsx, docente.ts y datos.ts': (
        'Que el código cargue cualquier cartilla, no solo inglés 3.',
        ['Crear una sola función que dé la ruta de una cartilla por su id.',
         'Reemplazar ingles-3 en src/App.tsx, src/adultos/docente.ts y src/materiales/datos.ts.',
         'Correr todas las pruebas: nada debe cambiar a la vista.'],
        'npm run build y las pruebas pasan; inglés 3 se ve igual que antes.'),
    'Multicartilla en el estudiante: el código del grupo lleva a su cartilla': (
        'Que cada niño llegue a la cartilla de su grupo.',
        ['Al entrar con el código o el QR, leer la cartilla del grupo.',
         'El modo sin conexión guarda la cartilla correcta.',
         'Crear una cartilla mínima de prueba para probar con dos cartillas.'],
        'La prueba del estudiante pasa con dos cartillas distintas a 390 px.'),
    'Multicartilla en el docente: Planear, Biblioteca y Proyectar según el grupo': (
        'Que el docente vea los materiales de la cartilla de cada grupo.',
        ['Planear, Biblioteca y Proyectar leen la cartilla del grupo elegido.',
         'Si el docente tiene grupos de cartillas distintas, puede elegir entre ellas.',
         'Ajustar las pruebas del docente y de la biblioteca.'],
        'Un docente con dos grupos de cartillas distintas ve los materiales correctos de cada uno.'),
    'Dueño: crear colegios y publicar cartillas': (
        'Que Manuel administre colegios y cartillas sin tocar la base de datos.',
        ['Pantalla de colegios: crear e invitar al coordinador.',
         'Pantalla de cartillas: publicar u ocultar y asignar a colegios.',
         'Diseño adulto: serio y profesional, a 390 px y a 1280 px.'],
        'Manuel crea un colegio de prueba y publica una cartilla desde la interfaz.'),
    'Coordinador: docentes y grupos': (
        'Que el coordinador organice su colegio.',
        ['Lista de docentes con invitación por correo.',
         'Grupos por grado, con su docente y su cartilla; reasignar un grupo.'],
        'El coordinador invita a un docente y le asigna un grupo en la prueba.'),
    'Coordinador: uso y avance por grado y grupo': (
        'Que el directivo vea el uso sin exponer a ningún niño.',
        ['Tablero por grado y grupo: niños activos en la semana, faroles encendidos y estrellas.',
         'Solo cifras de grupo, sin nombres de niños. Versión imprimible.'],
        'El tablero carga con datos simulados y se imprime en una hoja.'),
    'Plantilla de juego: contar y tocar (matemáticas)': (
        'Primer juego de matemáticas, para transición, 1.° y 2.°.',
        ['Aparecen objetos, la voz dice un número y el niño toca esa cantidad.',
         'Todo el contenido sale del JSON de la cartilla (regla 1); se juega sin saber leer.',
         'Error sin castigo: Lumi anima a intentar otra vez. Objetivos de toque de 48 px o más.'],
        'Se juega completo a 390 px y tiene su prueba en scripts/pruebas.'),
    'Plantilla de juego: ordenar (números y secuencias)': (
        'Juego para ordenar números, secuencias y sucesos de un cuento.',
        ['Tocar o arrastrar las tarjetas en orden, con audio de cada una.',
         'Sirve para matemáticas (números) y para español (orden de un relato).'],
        'Funciona con dos contenidos distintos (números y cuento) y tiene prueba.'),
    'Plantilla de juego: completar la operación': (
        'Sumas y restas con apoyo visual para 1.° a 5.°.',
        ['La operación se muestra con objetos y con números; el niño elige el resultado entre 3.',
         'Niveles por rango numérico, definidos en el JSON.'],
        'Se juega a 390 px con sumas de transición y con restas de 3.°.'),
    'Plantilla de juego: armar la sílaba o la palabra (español)': (
        'Juego de lectoescritura inicial.',
        ['Se oye una palabra con su imagen y el niño toca las sílabas en orden.',
         'Las sílabas suenan al tocarlas; las palabras vienen del banco de la cartilla.'],
        'Arma 5 palabras de prueba sin texto obligatorio y tiene prueba.'),
    'DiBrilla para leer en voz alta en español': (
        'Que la práctica de voz sirva también para leer en español.',
        ['Reconocimiento en español de Colombia.',
         'Premia el intento y no guarda grabaciones (regla 7).',
         'Revisar si src/escuchar.ts envía audio fuera del aparato.'],
        'Un niño lee 3 palabras en español y recibe sus estrellas; no queda audio guardado.'),
    'Pruebas de las plantillas en celular de gama baja': (
        'Que los juegos nuevos vayan fluidos en celulares baratos.',
        ['Emular un celular de gama baja (CPU 4x más lenta) a 390 px.',
         'Medir fluidez y peso de cada plantilla y corregir lo lento.'],
        'Las 4 plantillas nuevas van fluidas y la primera carga sigue por debajo de 2 MB.'),
    'Tanda 5: plan por grupo': (
        'Que el docente ponga fechas a los temas de su grupo.',
        ['Calendario de temas por grupo (clase 1 y clase 2 de cada tema).',
         'Inicio del docente muestra la próxima clase real.'],
        'Inicio muestra la próxima clase según el plan del grupo de prueba.'),
    'Tanda 6: avance y prueba del tema': (
        'Que el docente siga el avance y aplique la prueba del tema.',
        ['Avance por niño: faroles y estrellas, sin comparar a nadie en público.',
         'Prueba del tema en pantalla e imprimible, con su registro.'],
        'El docente ve el avance de su grupo y registra una prueba en la simulación.'),
    'Pantalla de canciones con letra sincronizada (estudiante)': (
        'Que los niños escuchen las canciones con la letra en pantalla.',
        ['Lista de canciones de la cartilla.',
         'Reproductor con la línea actual resaltada y las palabras en inglés destacadas.',
         'Funciona sin conexión; botones grandes; nada técnico a la vista.'],
        'Las 3 canciones suenan con la letra sincronizada a 390 px.'),
    'Registro del piloto (docente)': (
        'Que el docente lleve la bitácora del piloto (sirve a la tesis).',
        ['Por clase: fecha, tema, qué funcionó y qué no, e incidencias.',
         'Exportable e imprimible.'],
        'Se guarda una entrada de prueba y se exporta.'),
    'Materiales de inglés 3: cuerpo': (
        'Completar los materiales del tema Body parts.',
        ['El pedagogo escribe docs/pedagogia/materiales/cuerpo.md: guía, planeador de 2 clases de 55 min, láminas, fichas y prueba.',
         'Pasarlo a JSON con materiales_a_json.py y hacer las imágenes WebP.',
         'Revisar la impresión en carta y en media carta.'],
        'El tema aparece en Planear con todo y se imprime bien.'),
    'Materiales de inglés 3: familia': (
        'Completar los materiales del tema Family.',
        ['Igual que cuerpo: guía, planeador, láminas, fichas y prueba en docs/pedagogia/materiales/familia.md.',
         'JSON e imágenes; revisar la impresión.'],
        'El tema aparece en Planear con todo y se imprime bien.'),
    'Materiales de inglés 3: hora': (
        'Completar los materiales del tema Time.',
        ['Igual que cuerpo: guía, planeador, láminas, fichas y prueba en docs/pedagogia/materiales/hora.md.',
         'JSON e imágenes (reloj); revisar la impresión.'],
        'Los 6 temas del Bosque tienen materiales completos.'),
    'Rehacer las manos de números (Canva)': (
        'Cambiar las manos provisionales de los números 1 a 10.',
        ['Diseñar en Canva 10 manos contando, con el estilo de la cartilla.',
         'Exportar en WebP al tamaño en que se muestran y reemplazar en materiales/numeros/.'],
        'Las láminas de números se ven bien en pantalla y en la impresión.'),
    'Deudas: regla 1, tecla Espacio, solo:"docente", correos en español, carrera de docente.mjs': (
        'Saldar las deudas técnicas pendientes.',
        ['Pasar los textos fijos de Proyectar.tsx y RANURAS de datos.ts al JSON (regla 1).',
         'Arreglar el doble disparo de la tecla Espacio en Proyectar.',
         'Marcar clave, guion, casillas y momento como solo:"docente".',
         'Correos de Supabase en español (paso 9 de Manuel) y la carrera de carga de docente.mjs.'],
        'Todas las pruebas pasan dos veces seguidas sin fallas.'),
    'Formato de cartilla documentado y generador de paquetes (nueva_cartilla.py)': (
        'Que crear una cartilla nueva sea llenar datos, no programar.',
        ['Escribir docs/diseno/formato-cartilla.md: carpetas, cartilla.json, misiones, materiales y biblioteca.',
         'herramientas/nueva_cartilla.py crea el paquete vacío y un validador revisa que esté completo.'],
        'Con un comando sale una cartilla vacía que la plataforma abre sin errores.'),
    'Revisor: revisión de todo lo nuevo': (
        'Encontrar errores antes de cerrar la plataforma.',
        ['El agente revisor lee todo lo cambiado desde el 21 de noviembre.',
         'Hace una lista de hallazgos ordenada por gravedad.'],
        'Lista de hallazgos lista para corregir.'),
    'Correcciones del revisor': (
        'Corregir lo que encontró el revisor.',
        ['Corregir de mayor a menor gravedad; cada corrección con su prueba.'],
        'No queda ningún hallazgo grave abierto.'),
    'Auditor: peso, sin conexión, accesibilidad, seguridad por filas y datos de menores': (
        'Auditoría completa antes de abrir la plataforma a más colegios.',
        ['Usar la skill de auditoría: peso (menos de 2 MB), sin conexión, accesibilidad y uso en celular.',
         'Seguridad por filas en Supabase y datos de menores (Ley 1581).'],
        'Informe de auditoría con hallazgos.'),
    'Correcciones de la auditoría': (
        'Cerrar los hallazgos de la auditoría.',
        ['Corregir y volver a medir lo que falló.'],
        'La auditoría pasa sin hallazgos graves.'),
    'Unir la rama con main (con permiso), publicar y probar en Android real': (
        'Dejar la plataforma publicada y probada en un celular de verdad.',
        ['Con permiso de Manuel: unir la rama con main y publicar.',
         'En un Android real: micrófono, modo avión e instalación.'],
        'La plataforma publicada funciona en el celular, también sin internet.'),
    'Cierre de la plataforma: revisión semanal, CONTINUAR.md y guía docente al día': (
        'Cerrar la fase de plataforma.',
        ['Actualizar CONTINUAR.md y la guía para docentes en PDF con lo nuevo.',
         'Revisar con Manuel lo que viene: mallas y cartillas.'],
        'La plataforma queda lista para recibir cartillas nuevas.'),
    'Mallas de inglés transición a 5.° (currículo sugerido y DBA del MEN)': (
        'Definir qué se enseña en inglés en cada grado.',
        ['Por grado: 4 periodos, que son los 4 territorios; temas, vocabulario, funciones comunicativas y evidencias.',
         'Basado en el currículo sugerido de inglés y los DBA del MEN. Inglés 3 ya existe: alinear los demás grados con él.',
         'Escribir en docs/pedagogia/mallas/ingles.md.'],
        'La malla de inglés de 6 grados queda escrita y Manuel la revisa.'),
    'Mallas de español transición a 5.° (DBA de Lenguaje)': (
        'Definir qué se enseña en español en cada grado.',
        ['Por grado y periodo: oralidad, lectura, escritura y literatura según los DBA de Lenguaje.',
         'En transición y 1.°: conciencia fonológica, sílabas y lectura inicial.',
         'Escribir en docs/pedagogia/mallas/espanol.md.'],
        'La malla de español de 6 grados queda escrita y Manuel la revisa.'),
    'Mallas de matemáticas transición a 5.° (DBA de Matemáticas)': (
        'Definir qué se enseña en matemáticas en cada grado.',
        ['Por grado y periodo: numérico, espacial, métrico, aleatorio y variacional, según los DBA.',
         'Asignar a cada tema la plantilla de juego que le sirve.',
         'Escribir en docs/pedagogia/mallas/matematicas.md.'],
        'La malla de matemáticas de 6 grados queda escrita y Manuel la revisa.'),
    'Universos y guías de español y matemáticas (mundos, personajes)': (
        'Darle a español y a matemáticas un mundo propio, como Englishland.',
        ['Para cada materia: nombre del mundo, 4 territorios y un guía por territorio.',
         'Lumi y Pixie pueden acompañar a las tres materias.',
         'Bocetos de personajes (Canva o ElevenLabs) y escritura en docs/pedagogia/universos.md.'],
        'Manuel aprueba los dos universos.'),
    'Generar los 17 paquetes de cartilla y plan de audio (Kokoro borradores, ElevenLabs guías)': (
        'Dejar listas las 17 carpetas para llenarlas.',
        ['Correr nueva_cartilla.py para las 17 cartillas, con la malla de cada una.',
         'Plan de créditos: Kokoro para borradores y ElevenLabs solo para guías y frases clave; revisar el saldo.'],
        'Las 17 cartillas abren vacías en la plataforma y el plan de audio cabe en los créditos.'),
}

REVISION = ('Cerrar la semana con todo probado y publicado.',
            ['Correr todas las pruebas y mirar lo nuevo en el celular a 390 px.',
             'Actualizar CONTINUAR.md.',
             'Pedir permiso a Manuel y publicar.'],
            'Lo de la semana está publicado y CONTINUAR.md al día.')

CIERRE = ('Cerrar diciembre.',
          ['Probar en celular las cartillas de 4.° y 5.°.',
           'Publicar con permiso y actualizar CONTINUAR.md.',
           'Plan de enero: territorios 2 a 4 de cada cartilla.'],
          'Las 18 cartillas están en versión 1 y publicadas.')


def detalle(tema):
    """(propósito, pasos, listo cuando) de un bloque."""
    if tema in FIJOS:
        return FIJOS[tema]
    if tema.startswith('Revisión semanal'):
        return REVISION
    if tema.startswith('Cierre de diciembre'):
        return CIERRE
    nombre = tema.split(':')[0]  # «Español 1.°», «Audio e imágenes de …»
    sin_lectura = ' Todo debe poder usarse sin saber leer (regla 2).' if 'transición' in nombre or '1.°' in nombre else ''
    if 'contenido del territorio 1' in tema:
        return (f'Dejar jugable el primer territorio de {nombre}.',
                [f'Tomar de la malla de {nombre} los temas del periodo 1.',
                 'Definir 5 o 6 misiones de 3 a 5 minutos, cada una con su plantilla de juego.',
                 'Llenar el banco de ítems (palabras, números, imágenes), los textos del guía y las Mission Stars.' + sin_lectura,
                 'Probar el recorrido en el celular, con audio provisional.'],
                'El territorio 1 se juega de principio a fin a 390 px.')
    if 'materiales del docente' in tema:
        return (f'Que el docente de {nombre} pueda dar el periodo 1.',
                ['Escribir la guía y el planeador de 2 clases de 55 minutos por tema.',
                 'Hacer las láminas, las fichas (carta y media carta) y la prueba del tema.',
                 'Pasarlo a JSON y revisarlo en Planear y en la impresión.'],
                'Los materiales del periodo 1 se ven en Planear y se imprimen bien.')
    if tema.startswith('Audio e imágenes'):
        grados = tema.split(' de ', 1)[1].split(' (')[0]
        return (f'Poner voz e imágenes definitivas a las cartillas de {grados}.',
                ['Generar las voces: ElevenLabs para guías y frases clave, Kokoro para lo demás. Llevar la cuenta de créditos.',
                 'Hacer las imágenes en WebP al tamaño en que se muestran.',
                 'Revisar que cada cartilla pese menos de 2 MB en la primera carga.'],
                f'Las cartillas de {grados} tienen audio e imágenes y respetan el peso.')
    return ('Recuperar lo atrasado de la semana.', ['Terminar el bloque que haya quedado pendiente.'], 'No queda nada atrasado.')


def texto_plano(tema):
    p, pasos, listo = detalle(tema)
    return f'Propósito: {p}\n\nPasos:\n' + '\n'.join(f'- {x}' for x in pasos) + f'\n\nListo cuando: {listo}\n\nPara empezar, dígale a Claude: «Retoma el bloque: {tema}»'


def html(tema):
    p, pasos, listo = detalle(tema)
    return (f'<b>Propósito:</b> {p}<br><br><b>Pasos:</b><ul>' + ''.join(f'<li>{x}</li>' for x in pasos) +
            f'</ul><b>Listo cuando:</b> {listo}<br><br><i>Para empezar, dígale a Claude: «Retoma el bloque: {tema}»</i>')
