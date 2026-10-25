-- Reparación de usuarios creados por SQL directo (semilla 202610240002 + admin).
--
-- Problema (detectado 2026-10-25, login imposible en producción):
-- Los usuarios insertados a mano en auth.users carecían de fila en
-- auth.identities y tenían NULL en las columnas token. GoTrue moderno
-- resuelve el login por identities y escanea las columnas token como
-- strings no nulos: sin identity devuelve "Invalid login credentials"
-- y con los NULL respondía 500 en /auth/v1/token.
--
-- Idempotente: seguro de reejecutar. Ya aplicado a producción vía consola
-- el 2026-10-25; esta migración deja constancia para entornos nuevos.

-- 1) Identidades email para todo usuario que no tenga
insert into auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at)
select gen_random_uuid(), u.id, 'email', u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now()
from auth.users u
where u.email is not null and u.email <> ''
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- 2) Columnas token: NULL -> '' (GoTrue no tolera NULL ahí)
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, ''),
  raw_app_meta_data          = coalesce(raw_app_meta_data, '{}'::jsonb),
  raw_user_meta_data         = coalesce(raw_user_meta_data, '{}'::jsonb);
