// Edge Function "invitar" de Supabase (Deno). Envía el correo de invitación a un adulto.
//
// Cómo se instala (sin terminal): panel de Supabase → Edge Functions → "Deploy a new function"
// → "Via Editor", nombre `invitar`, pegar este archivo completo y desplegar. Dejar activado
// "Verify JWT" (solo la llaman adultos con sesión). No hace falta crear secretos: Supabase
// entrega SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY a toda Edge Function.
//
// Qué hace:
// 1. Con la sesión de quien llama ejecuta la función SQL `invitar()`, que comprueba que sea el
//    dueño o el coordinador del colegio (y que el coordinador solo invite docentes) y deja la
//    invitación registrada. Si la base la rechaza, aquí no se envía nada.
// 2. Con la clave de servicio (solo existe aquí, en el servidor) pide a Auth el correo de
//    invitación (`auth.admin.inviteUserByEmail`). El enlace lleva a /adultos con la sesión en el hash (type=invite);
//    la app lo reconoce allí y también si Auth lo manda a la raíz.
//    El gancho `antes_de_crear_usuario` deja crear la cuenta porque la invitación ya existe.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (peticion) => {
  if (peticion.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (peticion.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  const autorizacion = peticion.headers.get('Authorization') ?? '';
  if (!autorizacion.startsWith('Bearer ')) return responder({ error: 'Hace falta entrar con su cuenta' }, 401);

  let datos: { correo?: string; nombre?: string; rol?: string; colegio_id?: string | null };
  try {
    datos = await peticion.json();
  } catch {
    return responder({ error: 'Datos no válidos' }, 400);
  }
  const correo = String(datos.correo ?? '').trim().toLowerCase();
  const nombre = String(datos.nombre ?? '').trim();
  const rol = datos.rol === 'coordinador' ? 'coordinador' : 'docente';
  if (!correo || !nombre) return responder({ error: 'Faltan el correo o el nombre' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const publica = Deno.env.get('SUPABASE_ANON_KEY')!;
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1. Como quien llama: la base decide si puede invitar y registra la invitación.
  const comoQuienLlama = createClient(url, publica, {
    global: { headers: { Authorization: autorizacion } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: rechazo } = await comoQuienLlama.rpc('invitar', {
    p_correo: correo,
    p_nombre: nombre,
    p_rol: rol,
    p_colegio: datos.colegio_id ?? null,
  });
  if (rechazo) return responder({ error: rechazo.message }, 403);

  // 2. Con la clave de servicio: el correo. Auth solo acepta direcciones de la lista
  //    "Redirect URLs"; si el origen no está, usa la Site URL.
  const origen = peticion.headers.get('Origin') ?? '';
  const admin = createClient(url, servicio, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.inviteUserByEmail(correo, {
    redirectTo: origen ? `${origen}/adultos` : undefined,
  });
  if (error) {
    // Ya tiene cuenta confirmada pero no perfil: la invitación quedó registrada y se acepta
    // sola cuando entre con "Olvidé mi contraseña".
    if (error.status === 422 || /already been registered/i.test(error.message)) return responder({ estado: 'ya-registrado' });
    return responder({ error: 'No se pudo enviar el correo. Intente de nuevo más tarde.' }, 502);
  }
  return responder({ estado: 'enviada' });
});
