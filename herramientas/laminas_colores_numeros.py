"""Dibuja las 20 láminas (colores y números) en SVG y las exporta a WebP 600x600 transparente.
Uso: python3 herramientas/laminas_colores_numeros.py [directorio_salida_cartilla]
Requiere google-chrome (render headless) y Pillow."""
import math, os, subprocess, sys, tempfile
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "public/cartillas/ingles-3/materiales"
K = "#4a2a14"  # contorno
S = f'stroke="{K}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"'

def hl(x, y, rx, ry, rot=0, op=.55):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" transform="rotate({rot} {x} {y})" fill="#fff" opacity="{op}"/>'

def star(cx, cy, r, fill="#ffe14d"):
    pts = []
    for i in range(10):
        a = -math.pi/2 + i*math.pi/5
        rr = r if i % 2 == 0 else r*.45
        pts.append(f"{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{K}" stroke-width="5" stroke-linejoin="round"/>'

def red():
    return f'''<path d="M300 170 C250 120 120 150 120 300 C120 430 220 510 300 480 C380 510 480 430 480 300 C480 150 350 120 300 170Z" fill="#e5322d" {S}/>
<path d="M300 170 C300 230 300 330 300 480" fill="none" stroke="#b81f1f" stroke-width="6" opacity=".5"/>
{hl(190,260,28,60,25)}
<path d="M300 170 C295 130 310 95 335 70" fill="none" stroke="{K}" stroke-width="16" stroke-linecap="round"/>
<path d="M330 120 C370 70 440 80 460 110 C430 150 360 150 330 120Z" fill="#5fc23a" {S}/>
<path d="M340 118 C380 105 420 105 450 110" fill="none" stroke="#3a8a24" stroke-width="5"/>'''

def blue():
    return f'''<defs><clipPath id="c"><circle cx="300" cy="300" r="230"/></clipPath>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8fe8"/><stop offset="1" stop-color="#8fd3ff"/></linearGradient></defs>
<circle cx="300" cy="300" r="230" fill="url(#g)"/>
<g clip-path="url(#c)"><path d="M150 330 C130 330 125 290 160 285 C165 245 225 240 245 275 C275 255 330 275 325 310 C360 305 375 345 340 355 L160 355Z" fill="#fff" stroke="#9cc3ea" stroke-width="6" stroke-linejoin="round" transform="translate(70 -20)"/></g>
<circle cx="300" cy="300" r="230" fill="none" {S}/>{hl(190,170,40,18,-35)}'''

def green():
    return f'''<path d="M60 480 C90 420 80 400 110 380 C130 420 150 430 170 380 C190 430 230 440 250 370 C275 440 330 450 345 380 C375 440 420 440 440 380 C460 420 500 430 540 480Z" fill="#7bd04a" {S}/>
<path d="M300 440 C170 400 130 250 200 130 C250 70 360 60 410 120 C470 220 420 400 300 440Z" fill="#3fb73c" {S} transform="rotate(-18 300 300)"/>
<path d="M300 440 C300 330 330 220 340 120" fill="none" stroke="#1f7d2b" stroke-width="9" stroke-linecap="round" transform="rotate(-18 300 300)"/>
<path d="M312 330 L370 280 M318 250 L375 205 M306 380 L250 335 M312 290 L255 245" fill="none" stroke="#1f7d2b" stroke-width="6" stroke-linecap="round" transform="rotate(-18 300 300)"/>
{hl(230,200,18,55,25,.4)}'''

def yellow():
    rays = ""
    for i in range(12):
        a = i*30
        rays += f'<polygon points="300,40 322,105 278,105" fill="#ffb81f" stroke="{K}" stroke-width="7" stroke-linejoin="round" transform="rotate({a} 300 300)"/>'
    return f'''{rays}<circle cx="300" cy="300" r="150" fill="#ffd93b" {S}/>{hl(240,235,45,22,-35)}
<circle cx="255" cy="275" r="15" fill="{K}"/><circle cx="345" cy="275" r="15" fill="{K}"/>
<circle cx="251" cy="270" r="5" fill="#fff"/><circle cx="341" cy="270" r="5" fill="#fff"/>
<ellipse cx="225" cy="330" rx="22" ry="14" fill="#ff8a6b" opacity=".7"/><ellipse cx="375" cy="330" rx="22" ry="14" fill="#ff8a6b" opacity=".7"/>
<path d="M245 335 Q300 395 355 335" fill="none" stroke="{K}" stroke-width="10" stroke-linecap="round"/>'''

def orange():
    segs = ""
    for i in range(8):
        a = i*45
        segs += f'<path d="M300 300 L300 175 A125 125 0 0 1 388 212Z" fill="#ffae2e" stroke="#fff3c4" stroke-width="7" stroke-linejoin="round" transform="rotate({a-22} 300 300)"/>'
    return f'''<circle cx="300" cy="300" r="215" fill="#ff8a1c" {S}/><circle cx="300" cy="300" r="170" fill="#fff0c0"/>{segs}
<circle cx="300" cy="300" r="14" fill="#fff0c0"/>
<path d="M455 150 C500 80 570 90 580 120 C550 170 490 175 455 150Z" fill="#5fc23a" {S}/>{hl(160,200,20,10,-40,.6)}'''

def purple():
    cs = [(180,200),(300,200),(420,200),(240,290),(360,290),(180+60,380),(300,380),(300,470)]
    cs = [(200,210),(300,200),(400,210),(250,300),(350,300),(300,390),(300,470),(215,395)]
    cs = [(190,200),(300,190),(410,200),(245,285),(355,285),(190+110,370),(300,455)]
    g = "".join(f'<circle cx="{x}" cy="{y}" r="58" fill="#8a4fd6" {S}/>{hl(x-20,y-22,14,9,-35,.6)}' for x,y in cs)
    return f'''<path d="M300 150 C300 110 310 90 330 70" fill="none" stroke="{K}" stroke-width="16" stroke-linecap="round"/>
{g}<path d="M320 120 C370 55 450 60 475 95 C445 150 365 150 320 120Z" fill="#5fc23a" {S}/>'''

def pink():
    ps = "".join(f'<ellipse cx="300" cy="165" rx="75" ry="100" fill="#ff7eb6" {S} transform="rotate({i*72} 300 300)"/>' for i in range(5))
    return f'''{ps}<circle cx="300" cy="300" r="68" fill="#ffd93b" {S}/>{hl(278,278,18,10,-35,.7)}
<circle cx="285" cy="310" r="5" fill="#e69a00"/><circle cx="320" cy="300" r="5" fill="#e69a00"/><circle cx="305" cy="330" r="5" fill="#e69a00"/>'''

def brown():
    cells = ""
    for r in range(4):
        for c in range(3):
            x, y = 150+c*100, 75+r*85
            cells += f'<rect x="{x}" y="{y}" width="90" height="76" rx="12" fill="#8a4b22" stroke="#4a2410" stroke-width="5"/><rect x="{x+10}" y="{y+10}" width="70" height="56" rx="8" fill="#a65f2e"/>'
    return f'''<rect x="140" y="65" width="320" height="355" rx="26" fill="#6e3a17" {S}/>{cells}
<path d="M125 380 L475 380 L475 500 Q300 530 125 500Z" fill="#ffd54a" {S}/><path d="M125 380 L475 380" stroke="{K}" stroke-width="10"/>
<path d="M170 440 Q300 470 430 440" fill="none" stroke="#e53935" stroke-width="14" stroke-linecap="round"/>{hl(200,100,25,8,0,.35)}'''

def black():
    return f'''<defs><radialGradient id="n" cx=".35" cy=".3"><stop offset="0" stop-color="#2d2f6b"/><stop offset="1" stop-color="#0d0e26"/></radialGradient></defs>
<circle cx="300" cy="300" r="240" fill="url(#n)" {S}/>
<path d="M360 160 A115 115 0 1 0 430 330 A92 92 0 1 1 360 160Z" fill="#fff0a8" stroke="{K}" stroke-width="6" stroke-linejoin="round"/>
{star(170,170,28)}{star(440,440,24)}{star(170,420,20)}{star(465,210,18)}{star(300,500,16)}'''

def white():
    return f'''<ellipse cx="300" cy="470" rx="170" ry="22" fill="#9db4d0" opacity=".35"/>
<path d="M140 440 C70 440 55 350 120 335 C115 260 195 225 245 265 C275 190 390 195 410 275 C490 265 525 350 470 395 C500 440 460 450 440 440Z" fill="#fff" stroke="#8fa8c8" stroke-width="12" stroke-linejoin="round"/>
<path d="M150 410 C110 410 100 370 135 362" fill="none" stroke="#dbe6f4" stroke-width="10" stroke-linecap="round"/>
<path d="M260 300 C285 270 330 270 350 300" fill="none" stroke="#dbe6f4" stroke-width="10" stroke-linecap="round"/>'''

SKIN, SKIN2, CUFF = "#d9a066", "#bf8650", "#3a8fe8"

def hand(n):
    """Mano con la palma al frente y n dedos arriba (0-5). Caja local: x -50..200, y 20..510."""
    xs = [26, 76, 126, 176]       # índice, medio, anular, meñique
    tops = [60, 25, 55, 105]      # y superior de cada dedo levantado
    up = min(n, 4)
    out = f'<rect x="60" y="380" width="80" height="110" fill="{SKIN}" {S}/>'
    out += f'<rect x="40" y="440" width="120" height="70" rx="14" fill="{CUFF}" {S}/>'
    for i in range(up):
        x, t = xs[i], tops[i]
        out += f'<rect x="{x-22}" y="{t}" width="44" height="{300-t}" rx="22" fill="{SKIN}" {S}/>'
    out += f'<rect x="0" y="235" width="200" height="190" rx="55" fill="{SKIN}" {S}/>'
    for i in range(up):
        x = xs[i]
        out += f'<rect x="{x-17}" y="226" width="34" height="30" fill="{SKIN}"/>'
        out += f'<path d="M{x-8} {tops[i]+24} L{x-8} {tops[i]+70}" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35"/>'
    if n < 5:
        for i in range(up, 4):  # dedos doblados sobre la palma
            x = xs[i]
            out += f'<rect x="{x-22}" y="215" width="44" height="80" rx="22" fill="{SKIN}" {S}/>'
            out += f'<path d="M{x-10} 250 Q{x} 262 {x+10} 250" fill="none" stroke="{SKIN2}" stroke-width="6" stroke-linecap="round"/>'
        out += f'<rect x="20" y="320" width="130" height="46" rx="23" fill="{SKIN}" {S} transform="rotate(-18 85 343)"/>'
    else:
        out += f'<rect x="-48" y="250" width="52" height="140" rx="26" fill="{SKIN}" {S} transform="rotate(-38 -22 390)"/>'
        out += f'<rect x="8" y="300" width="184" height="110" rx="45" fill="{SKIN}"/>'
        out += f'<path d="M40 340 Q100 385 160 335" fill="none" stroke="{SKIN2}" stroke-width="7" stroke-linecap="round"/>'
    return out

def numero(n):
    if n <= 5:
        cx = 75 if n == 5 else 100
        return f'<g transform="translate({300-cx*1.0} 45)">{hand(n)}</g>'
    s, tx, ty = .8, 130, 100
    a = f'<g transform="translate({tx} {ty}) scale({s})">{hand(5)}</g>'
    b = f'<g transform="translate({600-tx} {ty}) scale(-{s} {s})">{hand(n-5 if n < 10 else 5)}</g>'
    return a + b

ITEMS = {"colores": {"red":red,"blue":blue,"green":green,"yellow":yellow,"orange":orange,"purple":purple,"pink":pink,"brown":brown,"black":black,"white":white},
         "numeros": {str(n): (lambda n=n: numero(n)) for n in range(1,11)}}

def render(svg, dest):
    with tempfile.TemporaryDirectory() as t:
        f = os.path.join(t, "a.svg"); png = os.path.join(t, "a.png")
        open(f, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">{svg}</svg>')
        html = os.path.join(t, "a.html")
        open(html, "w").write(f'<body style="margin:0;background:transparent"><img src="a.svg" width=600 height=600>')
        subprocess.run(["google-chrome","--headless","--no-sandbox","--disable-gpu","--hide-scrollbars","--default-background-color=00000000","--window-size=600,600",f"--screenshot={png}",html],check=True,capture_output=True)
        im = Image.open(png).convert("RGBA")
        im.save(dest, "WEBP", quality=80, method=6)

if __name__ == "__main__":
    for carpeta, d in ITEMS.items():
        os.makedirs(f"{OUT}/{carpeta}", exist_ok=True)
        for k, fn in d.items():
            render(fn(), f"{OUT}/{carpeta}/{k}.webp")
    print("listo")
