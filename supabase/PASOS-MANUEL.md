# Pasos en Supabase (los hace Manuel; la clave secreta nunca pasa por el chat)

Proyecto: https://supabase.com/dashboard → proyecto `jpwwmzfhbdnzsvwuciqa`. Hacerlos en orden.

1. **SQL Editor** → New query → pegar todo `supabase/migraciones/002-esqueleto.sql` → Run.
   Debe terminar sin error (se puede volver a correr sin daño).
2. **Authentication → Users → Add user → Create new user**: su correo y contraseña, marcando
   "Auto Confirm User". Tiene que ser **antes del paso 5**.
3. **SQL Editor**: darse el rol de dueño (correo en minúsculas):
   ```sql
   insert into perfiles (id, rol, nombre, correo)
   select id, 'dueno', 'Manuel Vega', email from auth.users where email = 'su-correo@ejemplo.com';
   ```
   Debe decir "1 row". Si dice 0, el correo no coincide con el del paso 2.
4. **SQL Editor**: registrar la versión de la cartilla:
   ```sql
   insert into cartilla_versiones values ('ingles-3', '2027.1', now(), null);
   ```
   (Habilitarla para un colegio se hará desde la pantalla del dueño en la tanda 7.)
5. **Authentication → Hooks** → "Before User Created" → tipo Postgres → función
   `public.antes_de_crear_usuario` → activar. "Allow new users to sign up" queda **encendido**
   (si se apaga, los niños no pueden entrar: usan sesiones anónimas).
6. **Authentication → Sign In / Providers → Email**: comprobar que **"Confirm email" está activado**.
   Es lo que impide que alguien use un correo invitado que no es suyo.
7. **Edge Functions → Deploy a new function → Via Editor**: nombre `invitar`, pegar
   `supabase/funciones/invitar/index.ts`, dejar "Verify JWT" activado → Deploy.
8. **Authentication → URL Configuration**: Site URL `https://cuadernodegoma.pages.dev`;
   en Redirect URLs agregar `https://cuadernodegoma.pages.dev/adultos/**`.
9. **Authentication → Email Templates**: pasar al español "Invite user" y "Reset password".
10. **Authentication → SMTP Settings**: configurar un correo propio (el de Supabase envía muy pocos
    por hora). Puede esperar hasta antes del piloto.
11. Solo si Netlify construye el sitio: en Netlify, variables `VITE_SUPABASE_URL` y
    `VITE_SUPABASE_CLAVE_PUBLICA` (valores en `.env.example`).

## Migración 004 (varias cartillas)

12. **SQL Editor** → New query → pegar todo `supabase/migraciones/004-multicartilla.sql` → Run.
    Debe terminar sin error (se puede volver a correr sin daño). Hacerlo **antes** de publicar en
    Netlify la versión que la usa: la app nueva manda un dato que la base vieja no conoce.
13. Comprobarla con esta consulta; debe dar `true`:
    ```sql
    select bool_and(cartilla_id = 'ingles-3') from grupos;
    ```
    (Si no hay grupos todavía, da vacío: también está bien.) Si algún día se vuelve a pegar la
    002, pegar después la 004 otra vez.

## Migración 005 (cambiar la cartilla de un grupo)

14. **SQL Editor** → New query → pegar todo `supabase/migraciones/005-cartilla-del-grupo.sql` → Run.
    Debe decir "Success". Sin ella, el coordinador no puede pasar un grupo a otra cartilla (solo
    hace falta cuando un colegio tenga más de una cartilla habilitada).

## Migración 009 (catálogo completo de cartillas)

15. **SQL Editor** → New query → pegar todo `supabase/migraciones/009-catalogo-cartillas.sql` → Run.
    Da de alta las 17 cartillas nuevas (matemáticas, español e inglés de transición a 5.°) **sin
    publicar**. No las publique todavía desde el modo dueño: se publican cuando su territorio 1 sea
    jugable. Comprobarla con `select count(*) from cartillas;` (debe dar 18).

## Migración 010 (misiones de matemáticas de transición)

16. **SQL Editor** → New query → pegar todo `supabase/migraciones/010-misiones-matematicas-0.sql` → Run.
    Deja en la base las 18 misiones de la página 1 de Cuadrito (transición), para que el progreso de
    los niños se guarde cuando la cartilla se publique. No la publica.

## Migración 011 (misiones de español de transición)

17. **SQL Editor** → New query → pegar todo `supabase/migraciones/011-misiones-espanol-0.sql` → Run.
    Igual que la 010, para la página 1 de Renglón (transición). No la publica.

## Migración 012 (misiones de inglés de transición)

18. **SQL Editor** → New query → pegar todo `supabase/migraciones/012-misiones-ingles-0.sql` → Run.
    Igual que la 010, para la página 1 de Postal (inglés de transición). No la publica.

## Migración 013 (cuento nuevo de español de transición)

19. **SQL Editor** → New query → pegar todo `supabase/migraciones/013-misiones-espanol-0-cuentos.sql` → Run.
    Suma la misión del cuento "La lluvia llega" a la biblioteca de Renglón. No publica la cartilla.

## Migración 014 (planeaciones y juegos del docente en su cuenta)

20. **SQL Editor** → New query → pegar todo `supabase/migraciones/014-mis-creaciones.sql` → Run.
    Debe terminar mostrando `creaciones = 0`. Crea la tabla donde quedan las planeaciones del
    armador y los juegos que arma cada docente, para verlos en el celular y en el computador. Solo
    el docente ve las suyas. Sin ella todo sigue funcionando, pero solo en el aparato donde se crearon.

Al terminar, avisar en el chat qué pasos quedaron hechos y si alguno dio error (copiar el mensaje).
