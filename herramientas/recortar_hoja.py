#!/usr/bin/env python3
"""Recorta una hoja de personaje de 3 poses (saludar, señalar, celebrar) sobre papel crema en tres WebP
con fondo transparente, a 280 px de ancho (2 veces lo que se muestra).

Uso: python3 herramientas/recortar_hoja.py hoja.png carpeta_salida nombre
"""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
src, outdir, nombre = sys.argv[1:4]
im = np.asarray(Image.open(src).convert('RGB')).astype(int)
H,W,_ = im.shape
bg = np.median(np.concatenate([im[:10].reshape(-1,3), im[-10:].reshape(-1,3), im[:,:10].reshape(-1,3), im[:,-10:].reshape(-1,3)]),axis=0)
diff = np.abs(im-bg).max(axis=2)
mx = im.max(axis=2); mn = im.min(axis=2)
sat = (mx-mn)
# fondo candidato: parecido al papel o sombra gris (poca saturación relativa)
fg = ((sat >= 40) & (diff > 30)) | (mx < 120)
fg = ndi.binary_closing(fg, iterations=2)
f2 = ndi.binary_fill_holes(fg)
hl,nh = ndi.label(f2 & ~fg)
papel = np.zeros_like(fg)
bmr = im[...,2]-im[...,0]
for i in range(1,nh+1):
    m = hl==i
    if m.sum()>60 and np.where(m)[0].mean() > 0.66*H and np.median(diff[m])<22 and np.median(bmr[m]) < -7:
        papel |= m
fg = f2 & ~papel
fg = ndi.binary_opening(fg, iterations=1)
lab2,n = ndi.label(fg)
sizes = ndi.sum(fg, lab2, range(1,n+1))
fg = np.isin(lab2, [i+1 for i,s in enumerate(sizes) if s > 150])
cols = fg.sum(axis=0)
# cortar en tercios por el mínimo de columna cerca de W/3 y 2W/3
cortes=[0]
for c in (W//3, 2*W//3):
    r = range(c-90,c+90); cortes.append(min(r, key=lambda x: cols[x]))
cortes.append(W)
alpha = Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
rgba = Image.fromarray(im.astype(np.uint8)).convert('RGBA'); rgba.putalpha(alpha)
for i,pose in enumerate(['saludar','senalar','celebrar']):
    a,b = cortes[i],cortes[i+1]
    sub = fg[:,a:b]; ys,xs = np.where(sub)
    box = (a+xs.min()-4, ys.min()-4, a+xs.max()+5, ys.max()+5)
    p = rgba.crop(box)
    w=280; h=round(p.height*w/p.width)
    p = p.resize((w,h), Image.LANCZOS)
    p.save(f'{outdir}/{nombre}-{pose}.webp', 'WEBP', quality=82, method=6)
    print(nombre,pose,p.size, cols[cortes[i+1]-1] if i<2 else '')
