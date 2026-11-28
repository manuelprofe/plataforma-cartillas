# Proyecto: Bodega Ruta (nombre provisional)

## Qué es
App web móvil (PWA) para una bodega urbana de servicio inmediato de bebidas en Cúcuta (Colombia). Reemplaza el manejo manual en Excel de: recepción de pedidos, división de rutas, entrega por repartidores, cuadre de caja e inventario de bodega y tienda.
Objetivo inmediato: tener un prototipo funcional y con datos de ejemplo para presentárselo al antiguo jefe del autor (dueño de la bodega) y que decida usarlo/comprarlo.

## Operación real (resumen)
- Cada mañana la planta de producción envía por correo un Excel con las entregas del día: cliente, dirección, teléfono y pedido (texto libre, ej. "3 bandejas y media de gaseosa manzana 2,5", "5 bandejas de jugo Hit surtido").
- Clientes: casi todos los negocios de La Alejandría y el centro de Cúcuta.
- Volumen: ~60 entregas/día, 7–8 repartidores.
- El coordinador de bodega: registra los fletes en Excel, divide rutas, imprime facturas, anota qué carga cada repartidor al salir, y en la tarde cuadra caja con cada uno.
- Los productos vienen en bandejas (paquetes), pero el cliente puede pedir fracciones (ej. 2,5 bandejas). Se envía la bandeja completa y el repartidor entrega la parte pedida; lo sobrante vuelve a bodega. Por eso el inventario se maneja en UNIDADES base y las bandejas son una presentación.
- Pago casi siempre de contado en efectivo; algunos por transferencia (se exige foto del voucher).
- Producto defectuoso: se marca con sticker y la planta lo cambia. La app solo registra el caso (foto, producto, cantidad, estado: pendiente de cambio / cambiado).
- La bodega también vende en puerta (mostrador) y hay inventario de almacén atrás. Al final del día se hacía conteo manual completo. Había "robo hormiga".
- Los repartidores eligen su orden de ruta; la app puede SUGERIR un orden, nunca imponerlo.
- Se quiere saber dónde están los repartidores (GPS) porque a veces se demoran mucho.
- Los clientes casi no se comunican con la bodega salvo por problemas. WhatsApp es el canal natural.

## Roles
- dueño: ve todo, reportes, configuración.
- coordinador: importa pedidos, arma rutas, despacha, cuadra caja, maneja inventario.
- repartidor: solo ve su ruta del día, entrega, cobra, registra devoluciones y novedades.
- tienda: registra ventas de puerta e inventario de mostrador.
- cliente: NO tiene cuenta. Recibe un link único por WhatsApp para seguir su pedido y confirmar recepción.

## Reglas de diseño (no negociables)
1. Inventario = libro de movimientos (kardex). NUNCA se edita el stock directamente. Cada movimiento guarda: producto, cantidad en unidades base, tipo (entrada_planta, salida_ruta, entrega, devolucion_a_bodega, venta_puerta, ajuste, defectuoso), usuario, fecha/hora, referencia (pedido/ruta) y motivo. El stock se calcula sumando movimientos.
2. Cantidades en unidades base. Cada producto tiene `unidades_por_bandeja`. Se aceptan fracciones de bandeja en pedidos y se convierten a unidades.
3. Conteo cíclico en lugar de conteo total diario: la app sugiere qué productos contar hoy y muestra diferencias contra el stock teórico.
4. Cuadre de caja automático por repartidor: esperado (entregado x precio, contado) vs. entregado en efectivo + transferencias con voucher. Muestra diferencia.
5. Mobile first. El repartidor usa smartphone con datos. Botones grandes, pocos pasos por entrega.
6. GPS solo durante una ruta activa, con consentimiento explícito (Ley 1581 de 2012, habeas data). Enviar ubicación cada 30–60 s; si no hay señal, encolar y sincronizar después.
7. Todo en español (Colombia). Moneda COP, sin decimales. Zona horaria America/Bogota.
8. Los textos de pedido libre se interpretan contra el catálogo con ayuda de IA o coincidencia aproximada, pero SIEMPRE con pantalla de revisión humana antes de confirmar.
9. Ventas y tiquetera: cada venta (de puerta o entrega a domicilio) se registra con cliente, productos, unidades (o bandejas y fracciones), precio y forma de pago. Al confirmarla se genera el movimiento de salida en el kardex (venta_puerta o entrega) y se imprime un tiquete/factura. Impresión primero desde el navegador con CSS para rollo térmico de 58/80 mm y hoja carta, sin depender de un modelo de impresora; después, comandos ESC/POS para tiqueteras USB o Bluetooth. Con la facturación electrónica (regla 12) el tiquete pasa a ser la representación impresa de la factura o del documento equivalente POS.
10. Compras a la planta: se registran como recepción (proveedor, fecha, factura, ítems, costo unitario) y generan el movimiento de entrada en el kardex.
11. Panel del dueño: ventas, compras y costos, margen por producto y por cliente, rotación de inventario, faltantes y diferencias por usuario, caja por repartidor, entregas y tiempos del día, y alertas (stock bajo, diferencia de caja, demora).
12. Facturación electrónica: no se implementa desde cero ante la DIAN; se integra un proveedor tecnológico autorizado con API, detrás de una interfaz propia para poder cambiar de proveedor. Al confirmar la venta se emite la factura electrónica (o el documento equivalente POS), se guardan el CUFE y el PDF/XML, y se envía al cliente por correo o WhatsApp. Hasta elegir proveedor, la interfaz queda como stub.

## Stack
- Next.js (App Router) + TypeScript + Tailwind, como PWA instalable.
- Supabase: Postgres, Auth, Storage (fotos de voucher/defectuosos/evidencia), Realtime (ubicación en vivo). Row Level Security por rol.
- Mapas: Leaflet + OpenStreetMap para el MVP. Optimización de ruta: empezar con vecino más cercano sobre coordenadas; luego evaluar OpenRouteService/Google Routes.
- Geocodificación de direcciones: guardar lat/lng por cliente la primera vez (el coordinador confirma el punto en el mapa) y reutilizar.
- Despliegue: Netlify o Vercel.
- WhatsApp: fase 1 con enlaces wa.me prellenados (manual); más adelante WhatsApp Business Cloud API.

## Convenciones
- Código y comentarios en inglés, interfaz y datos de ejemplo en español.
- Migraciones SQL versionadas en /supabase/migrations.
- Incluir seed con datos ficticios realistas (15 clientes, 20 productos, 3 repartidores, un día de pedidos) para poder hacer la demo. Los productos son de portafolio Postobón y Pepsi (gaseosas en varios sabores y tamaños, jugos Hit, agua, té, malta, hidratantes). Usar nombres y presentaciones típicas, con unidades por bandeja y precios INVENTADOS, marcados como provisionales en el código para reemplazarlos luego por la lista real. El formato real del Excel de la planta aún no se conoce: hacer el importador con mapeo de columnas configurable (cliente, dirección, teléfono, pedido) y tolerante a variaciones, y no asumir nombres de columnas fijos.
- Antes de cambios grandes, proponer plan corto y esperar confirmación.
- No guardar secretos en el repo; usar .env.local.

## Fuera de alcance por ahora
Pasarelas de pago, app nativa, app para clientes. La facturación electrónica no se desarrolla ante la DIAN desde cero: se integra un proveedor autorizado (Fase 3).

## Fases
1. Fase 1 (demo mínima): proyecto base, login por rol, catálogo, importar pedidos, armar rutas, vista del repartidor, entrega con confirmación y pago, cuadre automático.
2. Fase 2: inventario con kardex, ventas de puerta y tiquetera, compras, conteo cíclico, defectuosos, reportes de diferencias.
3. Fase 3: GPS en vivo, alerta de demora, link de seguimiento al cliente, WhatsApp, sugerencia de ruta, facturación electrónica (stub).
4. Fase 4: pulido para la presentación: dashboard del dueño, datos de ejemplo, guion de demo, manual corto.

## Decisiones ya tomadas para la propuesta
- El tiquete sale por defecto en rollo térmico de 58/80 mm, con opción de hoja carta.
- La propuesta incluye una tiquetera térmica económica (USB o Bluetooth), cotizada antes de la presentación. Mientras tanto se imprime desde el navegador.

## Entorno de desarrollo
- La base se prueba con Postgres 16 local imitando lo mínimo de Supabase (mismo enfoque que `../supabase/prueba_local.sql`), sin Docker.
- Esta carpeta vive dentro del repo `plataforma-cartillas` pero es un proyecto independiente: no comparte código ni base con las cartillas.
