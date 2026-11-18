#!/usr/bin/env python3
"""Convierte los materiales del docente (docs/pedagogia/materiales/*.md) en datos del paquete.

Los textos se editan en los .md; este script produce, en public/cartillas/ingles-3/materiales/:
  indice.json     temas, tipos del catálogo (con "qué traerá" para los huecos) y estado de cada material
  <tema>.json     los materiales del tema como documentos de bloques (esqueleto §4.1)

Uso:  python3 herramientas/materiales_a_json.py
Falla (con el motivo) si una palabra no tiene audio en el índice `voz` de cartilla.json o si una
imagen nombrada no existe en el paquete. No escribe nada si algo falla.
"""
import hashlib
import json
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MD = RAIZ / "docs/pedagogia/materiales"
CATALOGO = RAIZ / "docs/pedagogia/catalogo-interfaces.md"
PAQ = RAIZ / "public/cartillas/ingles-3"
SALIDA = PAQ / "materiales"

TEMAS = [("escuela", "escuela.md"), ("colores", "colores.md"), ("numeros", "numeros.md")]
# Temas del territorio que todavía no tienen documento: la plataforma los pinta como "Aquí irá".
PENDIENTES = [("cuerpo", "El cuerpo", "My face, My body"), ("familia", "La familia", "Hello, My family"), ("hora", "La hora", "What time is it?")]

# Tipos del catálogo §3.2 que usa la pantalla de materiales (id → nombre exacto en la tabla).
TIPOS = {
    "guia": "Guía del tema",
    "planeador": "Planeador de clase",
    "laminas": "Láminas",
    "fichas": "Fichas de trabajo",
    "decir": "Actividad de decir en parejas",
    "prueba": "Prueba del tema",
    "caritas": "Hoja de caritas",
    "casa": "Nota para la casa",
}
JUEGOS = "Juegos para proyectar"
CANCION = "Cinemáticas y canciones del tema"

# Formatos por tipo (catálogo §3.2: columnas Proy. e Imp.; esqueleto §4.3).
FORMATOS = {
    "guia": {"proyectar": "no", "imprimir": "carta", "copias": 1},
    "planeador": {"proyectar": "no", "imprimir": "carta", "copias": 1},
    "laminas": {"proyectar": "todo", "imprimir": "media-carta", "copias": 1},
    "ficha": {"proyectar": "solo-consignas", "imprimir": "media-carta", "copias": 2},
    "decir": {"proyectar": "solo-consignas", "imprimir": "carta", "copias": 1},
    "prueba": {"proyectar": "todo", "imprimir": "carta", "copias": 1},
    "casa": {"proyectar": "no", "imprimir": "media-carta", "copias": 2},
}

errores = []


def falla(msg):
    errores.append(msg)


# ---------------------------------------------------------------- Paquete

CARTILLA = json.loads((PAQ / "cartilla.json").read_text(encoding="utf-8"))
VOZ_EN = CARTILLA["voz"]["en"]
VOZ_ES = CARTILLA["voz"]["es"]


def audio_de(palabra, idioma="en"):
    tabla = VOZ_EN if idioma == "en" else VOZ_ES
    ruta = tabla.get(palabra)
    if ruta and not (PAQ / ruta).exists():
        falla(f'el audio de "{palabra}" ({ruta}) no está en el paquete')
        return None
    return ruta


def icono(codigo, obligatorio=True):
    """`iconos/1f534`, `1f534` o `iconos/eraser.webp` -> ruta del archivo que existe en iconos/."""
    c = codigo.strip().strip("`")
    c = re.sub(r"^iconos/", "", c)
    for cand in (c, c + ".svg", c + ".webp"):
        if (PAQ / "iconos" / cand).is_file():
            return "iconos/" + cand
    if obligatorio:
        falla(f"no existe la imagen iconos/{c}")
    return None


def limpio(t):
    return t.replace("`", "").strip()


# ---------------------------------------------------------------- Markdown

def partir_secciones(texto):
    partes = re.split(r"(?m)^## ", texto)
    res = {}
    for p in partes[1:]:
        titulo, _, cuerpo = p.partition("\n")
        n = int(re.match(r"(\d+)\.", titulo).group(1))
        cuerpo = re.sub(r"(?m)^---\s*$", "", cuerpo).strip("\n")
        res[n] = (titulo.strip(), cuerpo)
    return res


def partir_h3(cuerpo):
    """(texto antes del primer ###, [(título, cuerpo)])"""
    partes = re.split(r"(?m)^### ", cuerpo)
    subs = []
    for p in partes[1:]:
        t, _, c = p.partition("\n")
        subs.append((t.strip(), c.strip("\n")))
    return partes[0].strip("\n"), subs


def celdas(linea):
    return [c.strip() for c in linea.strip().strip("|").split("|")]


def leer_tabla(lineas):
    cab = celdas(lineas[0])
    filas = [celdas(l) for l in lineas[2:]]
    return cab, filas


def bloques_md(texto, tabla_especial=None):
    """Convierte Markdown simple (párrafos, listas, tablas, **títulos**) en bloques."""
    lineas = texto.split("\n")
    out, par, i = [], [], 0

    def vaciar():
        if par:
            out.append({"tipo": "parrafo", "texto": limpio(" ".join(par))})
            par.clear()

    while i < len(lineas):
        l = lineas[i]
        s = l.strip()
        if not s:
            vaciar()
        elif s.startswith("|"):
            vaciar()
            j = i
            while j < len(lineas) and lineas[j].strip().startswith("|"):
                j += 1
            cab, filas = leer_tabla(lineas[i:j])
            hecho = tabla_especial(cab, filas) if tabla_especial else None
            out.extend(hecho if hecho is not None else [{"tipo": "tabla", "columnas": [limpio(c) for c in cab], "filas": [[limpio(c) for c in f] for f in filas]}])
            i = j
            continue
        elif s.startswith("- "):
            vaciar()
            items = []
            while i < len(lineas) and lineas[i].strip().startswith("- "):
                items.append(limpio(lineas[i].strip()[2:]))
                i += 1
            out.append({"tipo": "lista", "items": items})
            continue
        elif re.match(r"^Notas del docente:", s):
            vaciar()
            out.append({"tipo": "nota", "id": "notas", "texto": "", "etiqueta": "Notas del docente"})
        else:
            m = re.match(r"^\*\*([^*]+)\*\*(.*)$", s)
            if m and (m.group(2).strip() in ("", ":") or m.group(2).rstrip().endswith(":")) and not m.group(1).rstrip().endswith(":"):
                vaciar()
                out.append({"tipo": "titulo", "texto": limpio(m.group(1)), "nivel": 2})
                resto = m.group(2).strip().rstrip(":").strip()
                if resto:
                    out.append({"tipo": "parrafo", "texto": limpio(resto)})
            else:
                par.append(s)
        i += 1
    vaciar()
    return out


# ---------------------------------------------------------------- Palabras de un tema

def numeral_de(codigo):
    m = re.search(r"003(\d)_20e3", codigo)
    if m:
        return int(m.group(1))
    return 10 if "1f51f" in codigo else None


def leer_palabras(sec1):
    """Tabla de palabras de la guía -> {en: {...}} en orden."""
    lineas = [l for l in sec1.split("\n") if l.strip().startswith("|")]
    inicio = next(i for i, l in enumerate(lineas) if celdas(l)[0] == "Palabra")
    cab, filas = leer_tabla(lineas[inicio:])
    # Se corta en la primera tabla (hay otras en la sección: errores, misiones).
    res = {}
    for f in filas:
        if len(f) != len(cab) or not f[1].startswith("`"):
            break
        en, img, _aud, suena, es, grupo = f[:6]
        ico = icono(img)
        a = audio_de(en)
        if a is None and en not in errores:
            falla(f'"{en}" no tiene audio en voz.en de cartilla.json')
        res[en] = {"en": en, "es": es, "suena": suena, "imagen": ico, "audio": a, "grupo": grupo, "numeral": numeral_de(img)}
    return res


def apoyo_de(tema, p):
    """Imagen nueva de la lámina: objeto (colores) o mano (números), si existe en materiales/<tema>/."""
    for nombre in (p["en"], str(p["numeral"]) if p["numeral"] else None):
        if nombre and (PAQ / "materiales" / tema / f"{nombre}.webp").is_file():
            return f"materiales/{tema}/{nombre}.webp"
    return None


def bloque_palabra(tema, p, alt=None):
    b = {"tipo": "palabra", "palabra": p["en"], "es": p["es"], "suena": p["suena"], "audio": p["audio"], "imagen": p["imagen"]}
    ap = apoyo_de(tema, p)
    if ap:
        b["apoyo"] = ap
    if p["numeral"]:
        b["cantidad"] = p["numeral"]
    if alt:
        b["alt"] = alt
    return b


# ---------------------------------------------------------------- Un tema

def construir_tema(tema, archivo):
    texto = (MD / archivo).read_text(encoding="utf-8")
    cab, _, resto = texto.partition("\n## ")
    secs = partir_secciones("## " + resto)
    h1 = re.match(r"# Materiales del docente: (.+?) \((.+)\)", cab)
    titulo_en, nombre_es = h1.group(1), h1.group(2)
    nombre = nombre_es[0].upper() + nombre_es[1:]
    territorio = re.search(r"\*\*Territorio:\*\* ([^·]+)·", cab).group(1).strip()
    aviso_color = None
    if re.search(r"\*\*Aviso de impresión:\*\*", cab):
        aviso_color = "Esta hoja necesita impresión a color o colorear a mano. Cada color lleva un objeto al lado, para quien no los distingue."

    palabras = leer_palabras(secs[1][1])
    por_numeral = {p["numeral"]: p for p in palabras.values() if p["numeral"]}
    contexto = {"tema": tema, "palabras": palabras, "por_numeral": por_numeral}

    mats = []

    def material(id_, tipo, titulo, sub, bloques, formatos=None, impresiones=None, editable=None, aviso=None):
        d = {"id": f"{tema}-{id_}", "tipo": tipo, "cartilla": "ingles-3", "tema": tema, "version": 1, "titulo": titulo, "subtitulo": sub,
             "origen": "paquete", "privacidad": "publico", "formatos": formatos or FORMATOS[tipo], "bloques": bloques}
        if impresiones:
            d["impresiones"] = impresiones
        if editable:
            d["editable"] = editable
        if aviso:
            d["avisoColor"] = aviso
        mats.append(d)

    # ---- Guía
    def tabla_palabras(cab_, filas):
        if cab_[0] == "Palabra" and "Imagen" in cab_ and "Audio" in cab_:
            return [bloque_palabra(tema, palabras[f[0]]) for f in filas if f[0] in palabras]
        return None

    intro = []
    for etiqueta in ("Territorio", "Cómo se usa", "Límite"):
        mm = re.search(rf"\*\*{etiqueta}:\*\* (.+)", cab)
        if mm:
            plano = re.sub(r"\s*·\s*\*\*([^*]+):\*\*", r" · \1:", mm.group(1))
            intro.append({"tipo": "parrafo", "texto": f"{etiqueta}: {limpio(plano)}"})
    guia = intro + bloques_md(secs[1][1], tabla_palabras)
    guia = [b for b in guia if not (b["tipo"] == "titulo" and b["texto"].startswith("Tema y territorio"))]
    material("guia", "guia", f"Guía del tema · {nombre}", "Guía del tema · para el docente", guia)

    # ---- Planeador
    antes, clases = partir_h3(secs[2][1])
    hora_tipo = bloques_md(antes)
    enlaces_ids = {}  # se completa al final, cuando se sabe qué materiales hay

    def momentos(cuerpo):
        out = []
        lineas = cuerpo.split("\n")
        i = 0
        resto, cola = [], []
        while i < len(lineas):
            if lineas[i].strip().startswith("|"):
                j = i
                while j < len(lineas) and lineas[j].strip().startswith("|"):
                    j += 1
                _c, filas = leer_tabla(lineas[i:j])
                for f in filas:
                    f = f + [""] * (6 - len(f))
                    out.append({"tipo": "momento", "minutos": int(f[0]), "momento": limpio(f[1]), "ritmo": limpio(f[2]), "material": limpio(f[3]), "observar": limpio(f[4]), "sinProyector": limpio(f[5])})
                i = j
                cola = lineas[j:]
                break
            resto.append(lineas[i])
            i += 1
        return out, "\n".join(cola)

    for n, (tit, cuerpo) in enumerate(clases, 1):
        ms, cola = momentos(cuerpo)
        nombre_clase = tit.split(":", 1)[1].strip()
        bl = list(hora_tipo) + ms + bloques_md(cola)
        material(f"planeador-{n}", "planeador", f"Clase {n}: {nombre_clase}", f"Planeador de clase · {nombre}", bl, editable=["notas"])

    # ---- Láminas
    antes3, _ = partir_h3(secs[3][1])
    lineas3 = antes3.split("\n")
    desc = " ".join(l.strip() for l in lineas3 if l.strip() and not l.strip().startswith("|"))
    tabla3 = [l for l in lineas3 if l.strip().startswith("|")]
    _c, f3 = leer_tabla(tabla3)
    alts = {f[0]: re.sub(r"\s*\(`[^`]+`\)", "", f[1]) for f in f3}
    laminas = [{"tipo": "parrafo", "texto": limpio(desc)}] + [bloque_palabra(tema, palabras[f[0]], alts.get(f[0])) for f in f3]
    material("laminas", "laminas", f"Láminas · {nombre}", "Una lámina por palabra · se proyecta y se imprime", laminas,
             impresiones=[{"nombre": "Láminas (una por media hoja)", "incluye": ["palabra"]}], aviso=aviso_color)

    # ---- Fichas
    _a4, fichas = partir_h3(secs[4][1])
    for n, (tit, cuerpo) in enumerate(fichas, 1):
        nombre_f = tit.split(":", 1)[1].strip()
        material(f"ficha-{n}", "ficha", f"Ficha {n}: {nombre_f}", "Ficha de trabajo · en parejas", ficha_bloques(cuerpo, contexto),
                 impresiones=[{"nombre": "Hoja de la pareja (dos por hoja)", "oculta": ["guion", "clave", "docente"], "copias": 2}, {"nombre": "Con guion y clave del docente", "copias": 1, "formato": "carta"}],
                 aviso=aviso_color)

    # ---- Decir en parejas
    tit5, cuerpo5 = secs[5]
    nombre_dec = re.search(r": (.+)$", tit5).group(1).strip()
    material("decir", "decir", f"Decir en parejas: {nombre_dec.strip(chr(34))}", f"Actividad de decir en parejas · {nombre}", decir_bloques(cuerpo5),
             impresiones=[{"nombre": "Hoja (con lo que dice el docente)", "copias": 1}], aviso=None)

    # ---- Prueba
    tit6, cuerpo6 = secs[6]
    material("prueba", "prueba", "El reto de Cosmo", f"Prueba del tema · {nombre}", prueba_bloques(cuerpo6, contexto),
             impresiones=[{"nombre": "Hoja del niño (sin nota ni puntaje)", "incluye": ["item-prueba"], "oculta": ["objetivo"], "copias": 1}, {"nombre": "Clave del docente", "copias": 1}], aviso=aviso_color)

    # ---- Nota para la casa
    def tabla_casa(cab_, filas):
        if cab_[0] == "Imagen" and cab_[1] == "Palabra":
            return [bloque_palabra(tema, palabras[f[1]]) for f in filas]
        return None

    casa = bloques_md(secs[7][1], tabla_casa)
    material("casa", "casa", f"Nota para la casa · {nombre}", "Para las familias de tercero", casa)

    # ---- Enlaces del planeador a sus materiales
    ids = {m["id"] for m in mats}
    reglas = [(r"lámina", "laminas"), (r"ficha 1", "ficha-1"), (r"ficha 2", "ficha-2"), (r"prueba", "prueba"), (r"decir en parejas|§5", "decir"), (r"nota para la casa", "casa"), (r"caritas", "caritas")]
    nombres = {"laminas": "Láminas", "ficha-1": "Ficha 1", "ficha-2": "Ficha 2", "prueba": "El reto de Cosmo", "decir": "Decir en parejas", "casa": "Nota para la casa", "caritas": "Hoja de caritas"}
    for m in mats:
        if m["tipo"] != "planeador":
            continue
        for b in m["bloques"]:
            if b["tipo"] != "momento":
                continue
            t = (b["momento"] + " " + b["material"] + " " + b["sinProyector"]).lower()
            enl = []
            for rx, clave in reglas:
                if re.search(rx, t) and f"{tema}-{clave}" not in [e["id"] for e in enl]:
                    if f"{tema}-{clave}" in ids or clave == "caritas":
                        enl.append({"id": f"{tema}-{clave}", "texto": nombres[clave]})
            if enl:
                b["enlaces"] = enl

    return {"id": tema, "nombre": nombre, "titulo": titulo_en, "territorio": territorio, "palabras": [{k: v for k, v in p.items() if k != "numeral"} for p in palabras.values()],
            "juegos": juegos_de(secs[1][1]), "materiales": mats}


def juegos_de(sec1):
    lineas = [l for l in sec1.split("\n") if l.strip().startswith("|")]
    for i, l in enumerate(lineas):
        if celdas(l)[0] == "Misión":
            _c, filas = leer_tabla(lineas[i:])
            vistos = []
            for f in filas:
                if len(f) >= 3 and f[1] not in vistos:
                    vistos.append(f[1])
            return vistos
    return []


# ---------------------------------------------------------------- Bloques de cada tipo

def etiquetados(cuerpo):
    """Viñetas `- **Etiqueta:** texto` (con continuación sangrada) -> [(etiqueta|None, texto)]"""
    items = []
    for l in cuerpo.split("\n"):
        if l.startswith("- "):
            items.append(l[2:].strip())
        elif l.startswith("  ") and l.strip() and items:
            items[-1] += " " + l.strip()
    res = []
    for it in items:
        m = re.match(r"\*\*([^*]+?):?\*\*:? ?(.*)$", it)
        res.append((m.group(1).strip(), m.group(2).strip()) if m else (None, it))
    return res


def consigna(texto, audio_alt=True):
    iconos = [r for r in (icono(c, False) for c in re.findall(r"`([^`]+)`", texto)) if r]
    q = re.search(r"[\"“]([^\"”]+)[\"”]", texto)
    frase = q.group(1).strip() if q else limpio(texto)
    b = {"tipo": "consigna", "iconos": iconos, "texto": frase}
    a = audio_de(frase, "es")
    if a:
        b["audio"] = a
    return b


def mayus(t):
    return t[:1].upper() + t[1:]


def decir_bloques(cuerpo):
    out = []
    for etq, texto in etiquetados(cuerpo):
        if etq and etq.startswith("Consigna"):
            out.append(consigna(texto))
        elif etq:
            if etq in ("Qué hace el docente al pasar", "Marco"):
                out.append({"tipo": "titulo", "texto": etq, "nivel": 2, "solo": "docente"})
                out.append({"tipo": "parrafo", "texto": mayus(limpio(texto)), "solo": "docente"})
            else:
                out.append({"tipo": "titulo", "texto": etq, "nivel": 2})
                out.append({"tipo": "parrafo", "texto": mayus(limpio(texto))})
    return out


def items_de(texto, ctx):
    """Lista de palabras (o numerales) separadas por comas -> bloques de imagen."""
    res = []
    for tok in [t.strip() for t in texto.split(",")]:
        tok = tok.strip(" .")
        if tok in ctx["palabras"]:
            p = ctx["palabras"][tok]
        elif tok.isdigit() and int(tok) in ctx["por_numeral"]:
            p = ctx["por_numeral"][int(tok)]
        else:
            return None
        it = {"imagen": p["imagen"], "palabra": p["en"]}
        ap = apoyo_de(ctx["tema"], p)
        if ap and ctx["tema"] == "colores":
            it["apoyo"] = ap
        if p["numeral"]:
            it["cantidad"] = p["numeral"]
        res.append(it)
    return res


def ficha_bloques(cuerpo, ctx):
    et = dict((e, t) for e, t in etiquetados(cuerpo) if e)
    libres = [t for e, t in etiquetados(cuerpo) if not e]
    out = [consigna(et["Instrucción con ícono"])]
    img = et.get("Imágenes", "")
    if "Cartón A" in img:
        for letra in ("A", "B"):
            m = re.search(rf"Cartón {letra}: (.+?)(?=Cartón|$)", img)
            filas = [items_de(f, ctx) for f in m.group(1).split("/")]
            out.append({"tipo": "imagenes", "titulo": f"Cartón {letra}", "columnas": 3, "items": [x for f in filas for x in f], "etiquetas": False})
    elif "Arriba:" in img or "Fila de arriba" in img:
        m1 = re.search(r"(?:Fila de arriba|Arriba): (.+?)\.", img)
        m2 = re.search(r"(?:Fila de abajo|Abajo): (.+?)\.", img)
        a, b = items_de(m1.group(1), ctx), items_de(m2.group(1), ctx)
        out.append({"tipo": "imagenes", "columnas": len(a), "items": a + b, "etiquetas": "cantidad" not in a[0]})
    elif "Izquierda:" in img:
        izq = re.search(r"Izquierda: .*?\(([^)]+)\)", img).group(1)
        der = re.search(r"Derecha: .*?numerales ([0-9][0-9, ]*[0-9])", img).group(1)
        izq_n = [int(x) for x in izq.split(",")]
        der_n = [int(x) for x in der.split(",")]
        der_n = der_n[2:] + der_n[:2]  # "en desorden": giro fijo para que no queden frente a su pareja
        out.append({"tipo": "imagenes", "titulo": "Cantidades", "columnas": 3, "items": [{"cantidad": n} for n in izq_n], "etiquetas": False})
        out.append({"tipo": "imagenes", "titulo": "Numerales", "columnas": 3, "items": [{"imagen": ctx["por_numeral"][n]["imagen"], "palabra": ctx["por_numeral"][n]["en"]} for n in der_n], "etiquetas": False})
    elif "cartas" in img:
        lista = img.split("cm:")[1].split(".")[0]
        it = items_de(lista, ctx)
        out.append({"tipo": "imagenes", "titulo": "Cartas para recortar", "columnas": 5, "items": it + it, "etiquetas": True, "recortable": True})
    else:
        nombres = re.search(r":\s*([^:]+)\.$", img.split("Imágenes:")[-1].strip())
        trae = [x.strip() for x in (nombres.group(1) if nombres else img).split(",")]
        out.append({"tipo": "hueco", "titulo": "Aquí irán los dibujos de la ficha", "trae": [f"Contorno grande sin pintar: {x}" for x in trae], "imprime": True})
    if "Guion del docente" in et:
        out.append({"tipo": "guion", "texto": limpio(et["Guion del docente"])})
    if "Clave" in et or any(e and e.startswith("Clave") for e, _ in etiquetados(cuerpo)):
        k = next(t for e, t in etiquetados(cuerpo) if e and e.startswith("Clave"))
        out.append({"tipo": "clave", "texto": limpio(k)})
    for t in libres:
        out.append({"tipo": "parrafo", "texto": limpio(t), "solo": "docente"})
    return out


def prueba_bloques(cuerpo, ctx):
    antes, subs = partir_h3(cuerpo)
    out = bloques_md(antes)
    for tit, c in subs:
        if tit.startswith("Escucha"):
            out.append({"tipo": "titulo", "texto": "Escucha: 6 ítems", "nivel": 2})
            lineas = c.split("\n")
            tabla = [l for l in lineas if l.strip().startswith("|")]
            textos = [l for l in lineas if l.strip() and not l.strip().startswith("|")]
            if textos:
                out.append({"tipo": "parrafo", "texto": limpio(textos[0])})
            _cab, filas = leer_tabla(tabla)
            for n, f in enumerate(filas, 1):
                obj = f[1]
                ops = []
                for celda in f[2:6]:
                    t = celda.replace("*", "").strip()
                    p = ctx["palabras"].get(t) or (ctx["por_numeral"].get(int(t)) if t.isdigit() else None)
                    if not p:
                        falla(f'prueba: "{t}" no es una palabra del tema')
                        continue
                    o = {"palabra": p["en"], "imagen": p["imagen"]}
                    if p["numeral"]:
                        o["cantidad"] = p["numeral"]
                    ap = apoyo_de(ctx["tema"], p)
                    if ap and ctx["tema"] == "colores":
                        o["apoyo"] = ap  # el objeto al lado: la hoja no depende solo del color
                    ops.append(o)
                if obj not in ctx["palabras"]:
                    falla(f'prueba: "{obj}" no es una palabra del tema')
                    continue
                out.append({"tipo": "item-prueba", "numero": n, "fila": f[0], "objetivo": obj, "audio": ctx["palabras"][obj]["audio"], "opciones": ops, "respuesta": int(f[6])})
            for t in textos[1:]:
                out.append({"tipo": "parrafo", "texto": limpio(t)})
        elif tit.startswith("Decir"):
            out.append({"tipo": "titulo", "texto": "Decir: 3 ítems", "nivel": 2})
            lineas = c.split("\n")
            tabla = [l for l in lineas if l.strip().startswith("|")]
            textos = [l for l in lineas if l.strip() and not l.strip().startswith("|")]
            out.append({"tipo": "parrafo", "texto": limpio(textos[0])})
            _cab, filas = leer_tabla(tabla)
            for f in filas:
                out.append(bloque_palabra(ctx["tema"], ctx["palabras"][f[1]]))
            out.append({"tipo": "casillas", "columnas": ["Intentó", "Todavía no"], "filas": [f"{f[0]} · {f[1]}" for f in filas], "solo": "docente"})
            for t in textos[1:]:
                out.append({"tipo": "parrafo", "texto": limpio(t), "solo": "docente"})
        elif tit.startswith("Clave"):
            out.append({"tipo": "titulo", "texto": "Clave del docente", "nivel": 2})
            textos = [l for l in c.split("\n") if l.strip()]
            out.append({"tipo": "clave", "texto": limpio(textos[0])})
        else:
            out.append({"tipo": "titulo", "texto": tit, "nivel": 2, "solo": "docente"})
            for b in bloques_md(c):
                b["solo"] = "docente"
                out.append(b)
    return out


# ---------------------------------------------------------------- Catálogo

def leer_catalogo():
    texto = CATALOGO.read_text(encoding="utf-8")
    sec = texto.split("### 3.2")[1].split("\n## ")[0]
    res = {}
    for l in sec.split("\n"):
        if not l.startswith("| **"):
            continue
        c = celdas(l)
        nombre = re.match(r"\*\*([^*]+)\*\*", c[0]).group(1)
        res[nombre] = {"nombre": nombre, "trae": [limpio(x).rstrip(".").strip() for x in c[1].split(";")], "paraQue": limpio(c[2])}
    return res


def main():
    catalogo = leer_catalogo()
    tipos = {}
    for id_, nombre in {**TIPOS, "juegos": JUEGOS, "cancion": CANCION}.items():
        if nombre not in catalogo:
            falla(f'el catálogo §3.2 no tiene el tipo "{nombre}"')
            continue
        tipos[id_] = catalogo[nombre]
    temas_doc = {}
    for tema, archivo in TEMAS:
        temas_doc[tema] = construir_tema(tema, archivo)
    if errores:
        print("No se escribió nada. Problemas:", *sorted(set(errores)), sep="\n  - ")
        sys.exit(1)

    SALIDA.mkdir(parents=True, exist_ok=True)
    indice_temas = []
    for tema, doc in temas_doc.items():
        contenido = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
        doc["version"] = hashlib.sha256(contenido.encode()).hexdigest()[:10]
        (SALIDA / f"{tema}.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        indice_temas.append({
            "id": tema, "nombre": doc["nombre"], "titulo": doc["titulo"], "territorio": doc["territorio"], "estado": "listo", "archivo": f"materiales/{tema}.json",
            "palabras": len(doc["palabras"]), "juegos": doc["juegos"],
            "materiales": [{"id": m["id"], "tipo": m["tipo"], "titulo": m["titulo"], "subtitulo": m["subtitulo"], "estado": "listo", "proyectar": m["formatos"]["proyectar"]} for m in doc["materiales"]],
        })
    # Los seis temas del territorio, en orden; los que no tienen documento van como pendientes.
    orden = ["escuela", "colores", "numeros"] + [p[0] for p in PENDIENTES]
    for id_, nombre, titulo in PENDIENTES:
        indice_temas.append({"id": id_, "nombre": nombre, "titulo": titulo, "territorio": "Bosque de los Sonidos", "estado": "pendiente", "materiales": []})
    indice_temas.sort(key=lambda t: orden.index(t["id"]))
    indice = {"cartilla": "ingles-3", "tipos": tipos, "temas": indice_temas}
    indice["version"] = hashlib.sha256(json.dumps(indice, ensure_ascii=False).encode()).hexdigest()[:10]
    (SALIDA / "indice.json").write_text(json.dumps(indice, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Listo: {len(temas_doc)} temas y su índice en {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
