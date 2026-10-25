-- ============================================================================
-- 202610240002 — Semilla de anuncios de maquinaria (37 anuncios, es_demo)
--
-- GENERADA por scripts/generar-sql-semilla.js desde src/lib/semilla-datos.js
-- (única fuente de verdad). NO editar a mano: regenerar con el script.
--
-- PROBLEMA QUE RESUELVE
-- =====================
-- Fase 5: «30-50 anuncios reales antes de abrir». La base estaba vacía:
-- marketplace sin stock no convierte y Google no confía en él. La semilla
-- publica anuncios de demostración de la vertical (tractores, excavadoras,
-- herramienta…) marcados `es_demo`:
--   · no se indexan en el sitemap ni exponen contacto (202609180003),
--   · nunca muestran sello de verificado ni teléfono (sin teléfonos
--     inventados: pertenecerían a personas reales),
--   · se sustituyen por anuncio real del vendedor cuando llegue el stock.
--
-- Idempotente: UUIDs deterministas (v5) + upsert por clave.
-- ============================================================================

begin;

-- ── 1) Usuarios de auth de los vendedores de semilla ──────────────────────
-- app_metadata.semilla = true es lo que exige destinatarioSemilla (chat).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a8c01b33-93b3-5b54-b0bc-a3d37285c53f',
  'authenticated',
  'authenticated',
  'semilla+agrodeal-castilla@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"AgroDeal Castilla"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'authenticated',
  'authenticated',
  'semilla+taller-el-palmar@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Talleres El Palmar"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'authenticated',
  'authenticated',
  'semilla+grupo-ibermaq@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Grupo Ibermaq"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'authenticated',
  'authenticated',
  'semilla+campo-verde-servicios@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Campo Verde Servicios"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'e4dbb18a-2513-56b9-9aca-5ef67d37e3b3',
  'authenticated',
  'authenticated',
  'semilla+excava-norte@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Excava Norte"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '01b1b21d-6c4f-5cb8-81ed-d678f7a11d72',
  'authenticated',
  'authenticated',
  'semilla+levante-obra@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Levante Obra y Maquinaria"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '9fd84107-d448-5137-814d-ba167aebd603',
  'authenticated',
  'authenticated',
  'semilla+taller-maquinaria-albacete@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Taller Maquinaria Albacete"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'authenticated',
  'authenticated',
  'semilla+eolo-generadores@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Eolo Generadores y Motores"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '4d3fc613-1aac-524f-acff-7269c3908730',
  'authenticated',
  'authenticated',
  'semilla+maria-laura-benitez@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"María Laura Benítez"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '95e7c256-089b-5a5a-a698-0141434483a7',
  'authenticated',
  'authenticated',
  'semilla+juan-ramon-estevez@maquinaria.click',
  crypt('Semilla-Maq-2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"semilla":true}',
  '{"semilla":"true","nombre":"Juan Ramón Estévez"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
  set updated_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data;

-- ── 2) Perfiles (sin teléfono, nunca verificados, es_demo) ─────────────────

insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  'a8c01b33-93b3-5b54-b0bc-a3d37285c53f',
  'AgroDeal Castilla',
  'Castilla y León',
  'Valladolid',
  'profesional',
  true,
  'agrodeal-castilla',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'Talleres El Palmar',
  'Andalucía',
  'Sevilla',
  'camperizador',
  true,
  'taller-el-palmar',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'Grupo Ibermaq',
  'Cataluña',
  'Barcelona',
  'profesional',
  true,
  'grupo-ibermaq',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'Campo Verde Servicios',
  'Murcia',
  'Murcia',
  'camperizador',
  true,
  'campo-verde-servicios',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  'e4dbb18a-2513-56b9-9aca-5ef67d37e3b3',
  'Excava Norte',
  'País Vasco',
  'Vizcaya',
  'camperizador',
  true,
  'excava-norte',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '01b1b21d-6c4f-5cb8-81ed-d678f7a11d72',
  'Levante Obra y Maquinaria',
  'Comunitat Valenciana',
  'Alicante',
  'profesional',
  true,
  'levante-obra',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '9fd84107-d448-5137-814d-ba167aebd603',
  'Taller Maquinaria Albacete',
  'Castilla-La Mancha',
  'Albacete',
  'camperizador',
  true,
  'taller-maquinaria-albacete',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'Eolo Generadores y Motores',
  'Aragón',
  'Zaragoza',
  'camperizador',
  true,
  'eolo-generadores',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '4d3fc613-1aac-524f-acff-7269c3908730',
  'María Laura Benítez',
  'Comunitat Valenciana',
  'Valencia',
  'particular',
  true,
  'maria-laura-benitez',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;
insert into public.perfiles (
  id, nombre, estado, ciudad, tipo_vendedor, es_demo, slug,
  verificado, telefono, telefono_visible, whatsapp_disponible
) values (
  '95e7c256-089b-5a5a-a698-0141434483a7',
  'Juan Ramón Estévez',
  'Galicia',
  'Lugo',
  'particular',
  true,
  'juan-ramon-estevez',
  false,
  null,
  false,
  false
)
on conflict (id) do update
  set nombre = excluded.nombre,
      estado = excluded.estado,
      ciudad = excluded.ciudad,
      tipo_vendedor = excluded.tipo_vendedor,
      es_demo = true,
      slug = excluded.slug,
      verificado = false,
      telefono = null,
      telefono_visible = false,
      whatsapp_disponible = false;

-- ── 3) Anuncios ───────────────────────────────────────────────────────────
-- Claves de especificaciones = etiquetas exactas del formulario (leen los
-- filtros del catálogo y las columnas generadas espec_anio / espec_horas).
-- Categoria por familia: agricola=13, obra=14, herramientas=15 (insertadas
-- por 202610240001; se resuelven por nombre por si cambian los ids).

insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '80ceb2f4-0bb9-5865-83d8-87c18fdac759',
  'a8c01b33-93b3-5b54-b0bc-a3d37285c53f',
  'John Deere 6M 120 CV · 4.180 horas · 2019',
  'Tractor John Deere 6M de 120 CV con 4.180 horas de uso en explotación de cereal. Único dueño, mantenimiento por libro en concesionario oficial con todas las facturas: último cambio de aceite y filtros a las 4.000 h.

Cabina climatizada con aire y calefacción, suspensión delantera, doble salida hidráulica, enganche de tres puntos y PTO 540/1000. Neumáticos traseros al 75% y delanteros recién estrenados. ITP en vigor hasta 2027 y documentación completa (factura original, libro sellado y marcado CE).

Se puede ver y probar en Valladolid con cita previa. Transferencia y transporte a península incluidos en el precio si se cierra esta semana.',
  (select id from public.categorias where nombre = 'agricola'),
  'Tractores',
  'John Deere 6M',
  '6M',
  'Bueno',
  52900::numeric, 52900::numeric, 52900::numeric,
  'Castilla y León', 'Valladolid',
  '/images/anuncios/jd-6m-120-1.webp',
  array['/images/anuncios/jd-6m-120-1.webp', '/images/anuncios/jd-6m-120-2.webp', '/images/anuncios/jd-6m-120-3.webp']::text[],
  true,
  false,
  null,
  512,
  now() - interval '624 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2019","Horas de uso":"4180","Combustible":"Diésel","Potencia (CV)":"120","Peso (kg)":"4900","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"4x4","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540/1000 rpm","Transmisión":"CVT / variable"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'ebf00a6a-015b-55cd-8a6c-9879fc7db39f',
  'a8c01b33-93b3-5b54-b0bc-a3d37285c53f',
  'Kubota M7-152 · 3.050 horas · como nuevo',
  'Kubota M7-152 del 2021 con solo 3.050 horas: la gama alta de Kubota con transmisión hidrostática de gama completa, palanca demando en el reposabrazos y cabina de serie con climatización.

Revisión general de 300 h hecha hace 80 horas: aceite, filtros de aceite, combustible y hidráulico, más pastillas de freno delanteras nuevas. Carrocería sin golpes, pintura original en bastidor y caja de enganche sin desgaste.

Procede de demonstración de concesionario, de ahí las pocas horas. Factura, libro y CE a disposición del comprador. Precio negociable en entrega inmediata.',
  (select id from public.categorias where nombre = 'agricola'),
  'Tractores',
  'Kubota M7',
  'M7',
  'Como nuevo',
  74500::numeric, 74500::numeric, 74500::numeric,
  'Castilla y León', 'Valladolid',
  '/images/anuncios/kubota-m7-152-1.webp',
  array['/images/anuncios/kubota-m7-152-1.webp', '/images/anuncios/kubota-m7-152-2.webp', '/images/anuncios/kubota-m7-152-3.webp']::text[],
  true,
  false,
  null,
  641,
  now() - interval '220 hours',
  '{}'::jsonb,
  now() - interval '6 hours',
  'aprobado',
  false,
  'profesional',
  '{"Año":"2021","Horas de uso":"3050","Combustible":"Diésel","Potencia (CV)":"152","Peso (kg)":"6800","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"4x4","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540/1000 rpm","Transmisión":"CVT / variable"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '7a11a5a5-cf4f-500f-856a-d434248b62c9',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'New Holland T6.180 Electro Command · 6.420 horas',
  'New Holland T6.180 con 6.420 horas, multipropósito de 175 CV para labores de transporte y campo. Cambio Electro Command de 6 adelantos y 3 retrasos funcionando con total normalidad.

Motor Tier 4 sin averías de FAP ni EGR, arranca en frío sin humo y no pierde potencia en cuesta. Exterior con marcas de uso lógicas (se aprecian en las fotos), sin oxidación estructural. Enganche de barra de tracción con toma hidráulica doble.

Libro de mantenimiento a medias: faltan las facturas de los dos últimos servicios, por eso se vende sin documentación completa. ITP en vigor. Se entrega con manuales y dos juegos de llaves.',
  (select id from public.categorias where nombre = 'agricola'),
  'Tractores',
  'New Holland T6',
  'T6',
  'Bueno',
  43900::numeric, 43900::numeric, 43900::numeric,
  'Murcia', 'Murcia',
  '/images/anuncios/nh-t6-180-1.webp',
  array['/images/anuncios/nh-t6-180-1.webp', '/images/anuncios/nh-t6-180-2.webp', '/images/anuncios/nh-t6-180-3.webp']::text[],
  true,
  false,
  null,
  387,
  now() - interval '1471 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2017","Horas de uso":"6420","Combustible":"Diésel","Potencia (CV)":"175","Peso (kg)":"7100","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"4x4","Enganche":"Barra de tracción","Toma de fuerza (PTO)":"540/1000 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'cd728536-503e-5a9f-a8a7-9cb39d64c7f1',
  '4d3fc613-1aac-524f-acff-7269c3908730',
  'Kubota M5-111 · 5.870 horas · parcelera mediana',
  'Mi Kubota M5-111 de 2016, el tractor de la finca de cítricos de la familia. 5.870 horas trabajando entre Valencia y Castellón: cargador frontal, arado de discos y remolque de riego.

Siempre en garaje y con mantenimiento hecho en el taller del pueblo (tengo todas las facturas desde 2019). Aceite y filtros cambiados hace 120 horas. Neumáticos con más del 60% de vida.

Vendo por cambio de explotación. No tiene aire acondicionado en cabina — es la única cosa que le falta. ITP al día, libro sellado y factura original de compra. Escucho ofertas razonables de quien la vaya a trabajar de verdad.',
  (select id from public.categorias where nombre = 'agricola'),
  'Tractores',
  'Kubota M5',
  'M5',
  'Bueno',
  28750::numeric, 28750::numeric, 28750::numeric,
  'Comunitat Valenciana', 'Valencia',
  '/images/anuncios/kubota-m5-111-1.webp',
  array['/images/anuncios/kubota-m5-111-1.webp', '/images/anuncios/kubota-m5-111-2.webp', '/images/anuncios/kubota-m5-111-3.webp']::text[],
  true,
  false,
  null,
  208,
  now() - interval '140 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'particular',
  '{"Año":"2016","Horas de uso":"5870","Combustible":"Diésel","Potencia (CV)":"110","Peso (kg)":"4300","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"4x4","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'd148771d-467c-55e0-8b2f-8d9f6224bd8d',
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'Case IH Farmall 75C · 7.240 horas · listo para trabajar',
  'Case IH Farmall 75C, tractor compacto de 75 CV ideal para ganadería, huerta y trabajos de comunidad. 7.240 horas con uso honesto: se le nota la jornada pero el motor está fuerte.

Revisión de motor y embrague hecha en nuestro taller hace 400 horas (facturas incluidas): junta de culata, embrague nuevo y bomba de agua. La cabina es sencilla con calefacción, sin aire acondicionado.

Carrocería con pintura retocada en guardabarros (fotos reales, sin sorpresas). Ideal como segunda máquina o primera para quien empieza. ITP en vigor; documentación parcial (falta factura original de compra).',
  (select id from public.categorias where nombre = 'agricola'),
  'Tractores',
  'Case IH Farmall',
  'Farmall',
  'Usado',
  21900::numeric, 21900::numeric, 21900::numeric,
  'Andalucía', 'Sevilla',
  '/images/anuncios/farmall-75c-1.webp',
  array['/images/anuncios/farmall-75c-1.webp', '/images/anuncios/farmall-75c-2.webp', '/images/anuncios/farmall-75c-3.webp']::text[],
  true,
  false,
  null,
  344,
  now() - interval '300 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2014","Horas de uso":"7240","Combustible":"Diésel","Potencia (CV)":"75","Peso (kg)":"3600","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"4x4","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '41b54ff7-4bf7-5dfd-acd4-ef2cdcff2dc0',
  '95e7c256-089b-5a5a-a698-0141434483a7',
  'Belarus 800.1 · 4.600 horas · simple y fiable',
  'Belarus 800.1 de 2015, tractor ruso de los que no piden electricista: 81 CV, caja de 5 velocidades reductora y toma de fuerza trasera. 4.600 horas trabajando en prados de Lugo.

Mecánicamente impecable: sin fugas de aceite ni de refrigerante, arranca a la primera en invierno. Neumáticos traseros nuevos del año pasado. Exterior sencillo, pintura original en el capó y algo de óxido en el estribo (foto).

Se vende porque hemos pasado a un tractor con cabina. Ideal para henificar, segar y transporte corto. CE y ficha técnica en regla, sin factura original. Entrega en Lugo; si estás lejos, lo subimos a tu transportista.',
  (select id from public.categorias where nombre = 'agricola'),
  'Tractores',
  'Belarus 800.1',
  '800.1',
  'Bueno',
  14800::numeric, 14800::numeric, 14800::numeric,
  'Galicia', 'Lugo',
  '/images/anuncios/belarus-800-1-1.webp',
  array['/images/anuncios/belarus-800-1-1.webp', '/images/anuncios/belarus-800-1-2.webp', '/images/anuncios/belarus-800-1-3.webp']::text[],
  true,
  false,
  null,
  176,
  now() - interval '480 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'particular',
  '{"Año":"2015","Horas de uso":"4600","Combustible":"Diésel","Potencia (CV)":"81","Peso (kg)":"3400","¿Incluye transporte?":"Sí","Documentación":"Declaración CE / ficha técnica","Tracción":"4x2","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '709f7250-d544-5e9d-be0b-43e847ab2be1',
  'a8c01b33-93b3-5b54-b0bc-a3d37285c53f',
  'Claas Lexion 530 · 1.890 horas de motor · 2019',
  'Claas Lexion 530 con 1.890 horas de rotor, cabina Premium con pantalla CEBIS, cabezal de cereal de 6,10 m y mesa de corte hidráulica.

Trabajó cuatro campañas en Castilla y León: siempre en garaje, revisión de campaña hecha antes de cada cebada (aceite de rotor, filtros y engrase general). Humógrafo, dosificación automática y ensacado en marcha sin incidencias.

Cepillo de limpieza y elevador de grano funcionando. Cintas de siembra en buen estado y trilladora alineada (última revisión en factura). Marcado CE y factura original disponibles; ITP en vigor.

Transporte especial incluido en la península. Se enseña con demostración en campo si hay siembra pendiente en la zona.',
  (select id from public.categorias where nombre = 'agricola'),
  'Cosechadoras',
  'Claas Lexion',
  'Lexion',
  'Bueno',
  132000::numeric, 132000::numeric, 132000::numeric,
  'Castilla y León', 'Valladolid',
  '/images/anuncios/lexion-530-1.webp',
  array['/images/anuncios/lexion-530-1.webp', '/images/anuncios/lexion-530-2.webp', '/images/anuncios/lexion-530-3.webp']::text[],
  true,
  false,
  null,
  702,
  now() - interval '960 hours',
  '{}'::jsonb,
  now() - interval '6 hours',
  'aprobado',
  false,
  'profesional',
  '{"Año":"2019","Horas de uso":"1890","Combustible":"Diésel","Potencia (CV)":"330","Peso (kg)":"12800","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"4x2","Enganche":"Sin enganche","Toma de fuerza (PTO)":"Sin PTO","Transmisión":"Hidrostática"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '62e0a18b-24a3-5108-ad54-d5bc424b02b7',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'Case IH Axial-Flow 7150 · 2.450 horas · cabezal incluido',
  'Case IH Axial-Flow 7150, cosechadora de rotor de 310 CV con 2.450 horas. Cabezal de cereal de 5,40 m incluido en el precio y corte de maíz disponible por diferencia.

Rotor y sinfín sin holguras, motor sin humos y transmisión hidráulica silenciosa. Cabina con A/C funcionando, luz de trabajo completa. Neumáticos de tracción con el 60% restante.

Última campaña en Murcia (trigo y cebada). Libro parcial: tenemos facturas desde 2020, no así las primeras. Marcado CE visible en la placa. Se entrega tras revisión de campaña a cargo del comprador (la hacemos en nuestro taller antes de la entrega si se prefiere).',
  (select id from public.categorias where nombre = 'agricola'),
  'Cosechadoras',
  'Case IH Axial-Flow',
  'Axial-Flow',
  'Bueno',
  96500::numeric, 96500::numeric, 96500::numeric,
  'Murcia', 'Murcia',
  '/images/anuncios/af-7150-1.webp',
  array['/images/anuncios/af-7150-1.webp', '/images/anuncios/af-7150-2.webp', '/images/anuncios/af-7150-3.webp']::text[],
  true,
  false,
  null,
  456,
  now() - interval '210 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2016","Horas de uso":"2450","Combustible":"Diésel","Potencia (CV)":"310","Peso (kg)":"11900","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"4x2","Enganche":"Sin enganche","Toma de fuerza (PTO)":"Sin PTO","Transmisión":"Hidrostática"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '73a8285f-eb95-57da-8820-5352688c0577',
  'a8c01b33-93b3-5b54-b0bc-a3d37285c53f',
  'Sembradora Amazone Primera D9-6000 · 4 m · con dosificador',
  'Sembradora Amazone Primera D9-6000 de 4 m con dosificadores mecánicos, barra de rastrelo neumática y tolvas de 600 l.

Para cereal en línea; rodillos del semillero y discos de siembra recién cambiados (factura de 2025). Estructura recta, sin reparaciones ni soldaduras. Enganche de tres puntos y toma de fuerza estándar.

Máquina parada en Valladolid desde la última campaña: engrasada y protegida. Factura original, manuales y CE completos. Ideal para quien siembra directa o quiere renovar una vieja de 3 m.',
  (select id from public.categorias where nombre = 'agricola'),
  'Maquinaria agrícola',
  'Amazone',
  'Primera',
  'Bueno',
  24900::numeric, 24900::numeric, 24900::numeric,
  'Castilla y León', 'Valladolid',
  '/images/anuncios/amazone-d9-1.webp',
  array['/images/anuncios/amazone-d9-1.webp', '/images/anuncios/amazone-d9-2.webp', '/images/anuncios/amazone-d9-3.webp']::text[],
  true,
  false,
  null,
  231,
  now() - interval '160 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2018","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"90","Peso (kg)":"2100","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Sin tracción","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'd24cc934-59b9-5e0a-bb9b-d8fe663712c1',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'Cultivador Horsch Pronto 6 DC · 6 m · discos',
  'Cultivador Horsch Pronto 6 DC de 6 metros, para trabajo de incorporación superficial a 5-8 cm. Dos filos de discos cortantes, tres hileras de cuchillas y rodillo de trasero empaquetador.

Discos al 70% de vida (se cambian por pares, no completos), rodamientos y ejes revisados este año. Estructura en muy buen estado, sin grietas en el bastidor principal.

Se vende por ampliar a 8 m. Funciona igual que el primer día; los discos cortantes llevan tres campañas. Factura de compra disponible, sin manuales. Entrega y carga en Murcia.',
  (select id from public.categorias where nombre = 'agricola'),
  'Maquinaria agrícola',
  'Horsch',
  'Pronto',
  'Bueno',
  31800::numeric, 31800::numeric, 31800::numeric,
  'Murcia', 'Murcia',
  '/images/anuncios/horsch-pronto-6-1.webp',
  array['/images/anuncios/horsch-pronto-6-1.webp', '/images/anuncios/horsch-pronto-6-2.webp', '/images/anuncios/horsch-pronto-6-3.webp']::text[],
  true,
  false,
  null,
  268,
  now() - interval '500 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2017","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"180","Peso (kg)":"4300","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"Sin tracción","Enganche":"Barra de tracción","Toma de fuerza (PTO)":"Sin PTO","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'bbc579d7-bd54-5599-9e01-426f2d0ba2fe',
  '9fd84107-d448-5137-814d-ba167aebd603',
  'Trituradora de setos Fella SM 145 L · 1,45 m',
  'Trituradora de setos y restos de poda Fella SM 145 L, de 1,45 m de ancho de trabajo, acoplable al tractor por tres puntos con PTO a 540 rpm.

Cuerpo hidráulico abatible, martillos en estado medio (unos 120 pares) y corte de material hasta 5 cm. Chasis sin fisuras y protecciones completas.

Máquina de taller reacondicionada: rodamientos nuevos y repintado completo. No conservamos papeles de la primera vida, se vende como está probada. Buen complemento para comunidades de regantes y gestores de poda.',
  (select id from public.categorias where nombre = 'agricola'),
  'Maquinaria agrícola',
  'Fella',
  'SM',
  'Bueno',
  6450::numeric, 6450::numeric, 6450::numeric,
  'Castilla-La Mancha', 'Albacete',
  '/images/anuncios/fella-sm-145-1.webp',
  array['/images/anuncios/fella-sm-145-1.webp', '/images/anuncios/fella-sm-145-2.webp', '/images/anuncios/fella-sm-145-3.webp']::text[],
  true,
  false,
  null,
  143,
  now() - interval '700 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2015","Horas de uso":"620","Combustible":"Diésel","Potencia (CV)":"45","Peso (kg)":"780","¿Incluye transporte?":"Sí","Documentación":"Sin documentación","Tracción":"Sin tracción","Enganche":"Tres puntos","Toma de fuerza (PTO)":"540 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '19d7a605-2941-5e88-a4e0-e31dc6fb8ed0',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'Sala de ordeño DeLaval VMS 500 · 2 puestos',
  'Sala de ordeño DeLaval VMS de 500 litros con dos puestos en paralelo, cinta de recogida de 220 l y pulsador automático de desenganche.

Desmontada de una explotación lechera de Murcia con 80 vacas. Bomba de vacío, regulador y sensor de flujo revisados; los vasos y pezoneras están al 80%. Cuerpo de lechería sin corrosión estructural.

Se entrega desmontada con esquema eléctrico y manual de instalación. CE de fabricación a la vista. Buena opción para quien monta o renueva sala pequeña; el transporte lo organizamos a península.',
  (select id from public.categorias where nombre = 'agricola'),
  'Ganadería',
  'DeLaval',
  'VMS',
  'Bueno',
  18400::numeric, 18400::numeric, 18400::numeric,
  'Murcia', 'Murcia',
  '/images/anuncios/delaval-vms-1.webp',
  array['/images/anuncios/delaval-vms-1.webp', '/images/anuncios/delaval-vms-2.webp', '/images/anuncios/delaval-vms-3.webp']::text[],
  true,
  false,
  null,
  197,
  now() - interval '340 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2013","Horas de uso":"3100","Combustible":"Diésel","Potencia (CV)":"15","Peso (kg)":"1900","¿Incluye transporte?":"Sí","Documentación":"Declaración CE / ficha técnica","Tracción":"Sin tracción","Enganche":"Sin enganche","Toma de fuerza (PTO)":"Sin PTO","Transmisión":"Hidrostática"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '1bef4100-14fd-513b-9737-dd8d55967aed',
  '95e7c256-089b-5a5a-a698-0141434483a7',
  'Remolque de pienso Kerbl Retro 2200 · 2,2 m³',
  'Remolque de reparto de piensos Kerbl Retro 2200, tolva de 2,2 m³ con cinta de descarga lateral y pala dosificadora.

Uso en explotación vacuna de Lugo, principalmente avena y paja picada. Sin fugas en el hidráulico, cinta con goma en buen estado y frenos recién ajustados.

Pintura original con marcas de uso, chasis recto. Factura y CE incluidas. Remolque ligero que mueve un tractor de 50 CV sin problemas; queda en la finca, se puede ver cualquier día.',
  (select id from public.categorias where nombre = 'agricola'),
  'Ganadería',
  'Kerbl',
  'Retro',
  'Bueno',
  6400::numeric, 6400::numeric, 6400::numeric,
  'Galicia', 'Lugo',
  '/images/anuncios/kerbl-retro-2200-1.webp',
  array['/images/anuncios/kerbl-retro-2200-1.webp', '/images/anuncios/kerbl-retro-2200-2.webp', '/images/anuncios/kerbl-retro-2200-3.webp']::text[],
  true,
  false,
  null,
  121,
  now() - interval '620 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'particular',
  '{"Año":"2019","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"55","Peso (kg)":"1650","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Sin tracción","Enganche":"Barra de tracción","Toma de fuerza (PTO)":"540 rpm","Transmisión":"Manual"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'eaa6ab13-9c58-50af-8cb1-3a7d19728385',
  'e4dbb18a-2513-56b9-9aca-5ef67d37e3b3',
  'Caterpillar 320 Next Gen · 9.800 horas · oruga',
  'CAT 320 Next Gen con 9.800 horas: la excavadora de 20 toneladas más vendida del mercado, con pantalla de conectividad y cámara trasera de serie.

Motor sin pérdidas de potencia, bomba principal revisada hace 1.200 h (factura) y caudal hidráulico correcto en las dos vías. Juego en articulaciones dentro de tolerancia; varillas de cilindros sin goteo.

Tren de rodaje al 70%: ruedas guía y excentricas recién cambiadas, cadenas con uso equilibrado. Arco ROPS, calefacción y A/C funcionando, silla giratoria con apoyabrazos.

Documentación completa (factura original, libro de mantenimiento sellado, CE y ITP). Se prueba en nuestra nave de Vizcaya; transporte especial a península incluido si se cierra en el precio publicado.',
  (select id from public.categorias where nombre = 'obra'),
  'Excavadoras',
  'Caterpillar 320',
  '320',
  'Bueno',
  89500::numeric, 89500::numeric, 89500::numeric,
  'País Vasco', 'Vizcaya',
  '/images/anuncios/cat-320-1.webp',
  array['/images/anuncios/cat-320-1.webp', '/images/anuncios/cat-320-2.webp', '/images/anuncios/cat-320-3.webp']::text[],
  true,
  false,
  null,
  810,
  now() - interval '480 hours',
  '{}'::jsonb,
  now() - interval '6 hours',
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2019","Horas de uso":"9800","Combustible":"Diésel","Potencia (CV)":"174","Peso (kg)":"23200","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Oruga","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '73ee17d7-9e8f-5d9f-9ee3-ed32a0ae9885',
  '01b1b21d-6c4f-5cb8-81ed-d678f7a11d72',
  'Hitachi ZX200-6 · 12.400 horas · mantenimiento al día',
  'Hitachi ZX200-6 de 2017 con 12.400 horas, excavadora sobre oruga de 20 t para obra civil y saneamientos. Conocida por su fiabilidad hidráulica y consumo contenido.

Último servicio de 1.000 h hace 300 horas: aceite de motor y transmisión, filtros y pruebas de presión sin incidencias. Fuga menor en la manguera de balancín (se ve en foto, reparación de 150 € aproximadamente).

Orugas con excentricas nuevas, ruedas guía con la primera rectificada hecha. Cabina íntegra, A/C y calefacción operativos. Pintura original en la torreta con retoques en el brazo (uso normal).

ITP y CE en regla, facturas de mantenimiento desde 2021. Se entrega tras revisión de renta horaria y pruebas de función en nuestra nave de Alicante.',
  (select id from public.categorias where nombre = 'obra'),
  'Excavadoras',
  'Hitachi ZX200',
  'ZX200',
  'Bueno',
  61500::numeric, 61500::numeric, 61500::numeric,
  'Comunitat Valenciana', 'Alicante',
  '/images/anuncios/zx200-6-1.webp',
  array['/images/anuncios/zx200-6-1.webp', '/images/anuncios/zx200-6-2.webp', '/images/anuncios/zx200-6-3.webp']::text[],
  true,
  false,
  null,
  597,
  now() - interval '1680 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2017","Horas de uso":"12400","Combustible":"Diésel","Potencia (CV)":"151","Peso (kg)":"20300","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"Oruga","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '9f72ac1d-724c-52dd-a3be-33269df0bf88',
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'Doosan DX140LC · 7.650 horas · recién revisada',
  'Doosan DX140LC del 2020, 14 toneladas de uso en demoliciones ligeras y movimientos de tierra. 7.650 horas con revisión general de bombas y motores hidráulicos facturada en enero.

Cuerpo sin golpes estructurales, pintura original de fábrica salvo retoques en contrapeso. Tren de rodaje al 80%, cadenas y ruedas de rodadura recién rectificadas por par.

Cabina con pantalla de cámaras, A/C y radio. Sistema de detección de parada automática (pig) operativo. Marcado CE, factura y libro completo; ITP hasta 2028.

Demostración posible en Barcelona con cita. Precio con IVA no incluido para empresas (se factura conforme); para particular, todo incluido.',
  (select id from public.categorias where nombre = 'obra'),
  'Excavadoras',
  'Doosan DX140',
  'DX140',
  'Como nuevo',
  54900::numeric, 54900::numeric, 54900::numeric,
  'Cataluña', 'Barcelona',
  '/images/anuncios/dx140lc-1.webp',
  array['/images/anuncios/dx140lc-1.webp', '/images/anuncios/dx140lc-2.webp', '/images/anuncios/dx140lc-3.webp']::text[],
  true,
  false,
  null,
  486,
  now() - interval '816 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2020","Horas de uso":"7650","Combustible":"Diésel","Potencia (CV)":"115","Peso (kg)":"14600","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Oruga","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'd3afba51-1745-5d46-b009-f0e9af7d5b89',
  'e4dbb18a-2513-56b9-9aca-5ef67d37e3b3',
  'JCB JS145 · 10.200 horas · zona media',
  'JCB JS145 de 14,5 t con 10.200 horas, excavadora de tamaño medio muy polivalente para empresas de urbanización y zanjas medianas.

Motor 4,4 l en régimen, sin humos ni pérdidas de compresión. Hidráulica con caudal correcto pero con reparación antigua en el cilindro de balancín (soldadura hecha en 2022, factura en taller local).

Tren de rodaje al 55%: prever rectificación o cambio de ruedas de rodadura en los próximos 2.000 h. Exterior con marcas de trabajo, sin accidentes graves.

Se vende SIN papeles (factura original extraviada): por eso el precio. Comprador responsable debe aportar documentación de compra ante notario si lo necesita; nosotros dejamos contrato y copia de la ficha técnica de la máquina. Prueba de función en Vizcaya.',
  (select id from public.categorias where nombre = 'obra'),
  'Excavadoras',
  'JCB JS145',
  'JS145',
  'Usado',
  42900::numeric, 42900::numeric, 42900::numeric,
  'País Vasco', 'Vizcaya',
  '/images/anuncios/js145-1.webp',
  array['/images/anuncios/js145-1.webp', '/images/anuncios/js145-2.webp', '/images/anuncios/js145-3.webp']::text[],
  true,
  false,
  null,
  372,
  now() - interval '420 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2015","Horas de uso":"10200","Combustible":"Diésel","Potencia (CV)":"145","Peso (kg)":"15400","¿Incluye transporte?":"Sí","Documentación":"Sin documentación","Tracción":"Oruga","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'f7f41eae-d76d-5345-9cf2-f3ea03054fc0',
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'Hyundai R215-9 · 6.900 horas · garantía de taller 6 meses',
  'Hyundai R215-9 de 2019 con 6.900 horas, una de las 20 t con mejor relación prestaciones-precio del mercado europeo. Vehiculo de flota propia, con historial completo.

Revisión de 1.000 h realizada en nuestro taller: filtros, aceites, pruebas de presión y rectificación de ruedas de rodadura incluidas. Se entrega con GARANTÍA de taller de 6 meses en bombas y motores hidráulicos.

Cámara trasera, A/C, bloque de calentador y silla con suspensión. Tren al 75% y pintura original en cuerpo principal.

Factura, libro sellado, CE y ITP en vigor. Financiación disponible a través de nuestra entidad (sujeta a aprobación). Uno de los anuncios más completos de nuestro catálogo.',
  (select id from public.categorias where nombre = 'obra'),
  'Excavadoras',
  'Hyundai R215',
  'R215',
  'Bueno',
  67800::numeric, 67800::numeric, 67800::numeric,
  'Cataluña', 'Barcelona',
  '/images/anuncios/r215-9-1.webp',
  array['/images/anuncios/r215-9-1.webp', '/images/anuncios/r215-9-2.webp', '/images/anuncios/r215-9-3.webp']::text[],
  true,
  false,
  null,
  418,
  now() - interval '110 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2019","Horas de uso":"6900","Combustible":"Diésel","Potencia (CV)":"174","Peso (kg)":"21400","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Oruga","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '1836b378-48b5-5d9e-8f58-436f48d73c9f',
  '01b1b21d-6c4f-5cb8-81ed-d678f7a11d72',
  'Caterpillar 950M · 6.300 horas · ruedas',
  'Cargadora frontal CAT 950M con 6.300 horas, pala de 3,2 m³ con cantos de acero nuevos y sistema de descarga alta.

Transmisión Powershift revisada, embragues dentro de tolerancia y ejes con aceites analizados (informe incluido). Neumáticos al 65% — 20.5 R25 con banda original.

Cabina con A/C, cámara trasera y visibilidad 360°. Estructura sin reparaciones, contrapeso original.

Factura, libro mantenimiento y CE completos. Se prueba en Alicante; entrega en obra de la península posible con camión de plataforma.',
  (select id from public.categorias where nombre = 'obra'),
  'Cargadoras',
  'Caterpillar 950',
  '950',
  'Bueno',
  78900::numeric, 78900::numeric, 78900::numeric,
  'Comunitat Valenciana', 'Alicante',
  '/images/anuncios/cat-950m-1.webp',
  array['/images/anuncios/cat-950m-1.webp', '/images/anuncios/cat-950m-2.webp', '/images/anuncios/cat-950m-3.webp']::text[],
  true,
  false,
  null,
  523,
  now() - interval '1320 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2018","Horas de uso":"6300","Combustible":"Diésel","Potencia (CV)":"220","Peso (kg)":"17800","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Ruedas 4x4","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '0ff06881-171d-501f-8dfe-cb54c313c6b8',
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'JCB 411 ZX · retroexcavadora · 8.100 horas',
  'JCB 411 ZX, retroexcavadora de 4 ruedas con pala delantera y brazo trasero: la máquina polivalente de obra pequeña, instalaciones y mantenimiento municipal.

8.100 horas; motor 4,4 l sin fugas ni humos, frenos nuevos hace 600 h. Juego en la articulación central dentro de límites (se mide en prueba). Brazo trasero sin soldaduras de reparación.

Pala frontal con filos nuevos, martillo hidráulico opcional disponible por diferencia. Neumáticos traseros al 70%.

Documentación parcial (falta factura de compra original, sí libro y ITP). Máquina de nuestro taller con garantía de 3 meses en lo mecánico. Precio negociable a pago inmediato.',
  (select id from public.categorias where nombre = 'obra'),
  'Cargadoras',
  'JCB 411',
  '411',
  'Bueno',
  34500::numeric, 34500::numeric, 34500::numeric,
  'Cataluña', 'Barcelona',
  '/images/anuncios/jcb-411-zx-1.webp',
  array['/images/anuncios/jcb-411-zx-1.webp', '/images/anuncios/jcb-411-zx-2.webp', '/images/anuncios/jcb-411-zx-3.webp']::text[],
  true,
  false,
  null,
  441,
  now() - interval '85 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2016","Horas de uso":"8100","Combustible":"Diésel","Potencia (CV)":"109","Peso (kg)":"8400","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"Ruedas 4x4","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'e627bfa3-8c9e-59e9-8100-83cbb7d0665b',
  '9fd84107-d448-5137-814d-ba167aebd603',
  'Caterpillar 906 Compact · 4.450 horas · compacta',
  'CAT 906 Compact de 2021, cargadora de neumático de tamaño compacto para constructora, urbanismo y trabajos en interior de nave. 4.450 horas.

Estrecha (1,89 m) y maniobrable, con pala de 1,0 m³, acoplamiento rápido hidráulico y salida de tercer circuito. Motor Stage V con filtro de partículas sin historial de averías.

Cabinada con A/C y radio, cámara de reverso, alarmas acústicas y luces LED de trabajo. Pintura original salvo microarañazos de uso normal.

Factura, manual, CE y ITP al día. Una de las unidades mejor conservadas que hemos tenido: se ve y se prueba en Albacete.',
  (select id from public.categorias where nombre = 'obra'),
  'Cargadoras',
  'Caterpillar 906',
  '906',
  'Como nuevo',
  41200::numeric, 41200::numeric, 41200::numeric,
  'Castilla-La Mancha', 'Albacete',
  '/images/anuncios/cat-906-1.webp',
  array['/images/anuncios/cat-906-1.webp', '/images/anuncios/cat-906-2.webp', '/images/anuncios/cat-906-3.webp']::text[],
  true,
  false,
  null,
  358,
  now() - interval '140 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2021","Horas de uso":"4450","Combustible":"Diésel","Potencia (CV)":"55","Peso (kg)":"5900","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Ruedas 4x4","Medidas de transporte":"2,5 – 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '94d96d60-343b-5e00-8166-c2de3a6ed7c5',
  '01b1b21d-6c4f-5cb8-81ed-d678f7a11d72',
  'Apisonador Bomag BW120 AD-5 · 3.100 horas',
  'Apisonador de doble tambor Bomag BW120 AD-5 con 3.100 horas, de 120 kN de fuerza centrípeta, ideal para compactación de firmes, rellenos y zanjas.

Motores de vibración sin fugas, amplitudes verificadas con analizador (informe del taller). Tambor con bordes sin fisuras y rodillos de rasillón en buen estado.

Motor diesel sin humos, arranque eléctrico y deslizadores frontales recién puestos. Cabina abierta con parabrisas y toldo.

Libro y mantenimiento parcial, sin factura de compra original. ITP en vigor. Se entrega con repuestos de filtros del próximo servicio.',
  (select id from public.categorias where nombre = 'obra'),
  'Compactación',
  'Bomag BW120',
  'BW120',
  'Bueno',
  26800::numeric, 26800::numeric, 26800::numeric,
  'Comunitat Valenciana', 'Alicante',
  '/images/anuncios/bomag-bw120-1.webp',
  array['/images/anuncios/bomag-bw120-1.webp', '/images/anuncios/bomag-bw120-2.webp', '/images/anuncios/bomag-bw120-3.webp']::text[],
  true,
  false,
  null,
  244,
  now() - interval '260 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2018","Horas de uso":"3100","Combustible":"Diésel","Potencia (CV)":"98","Peso (kg)":"10800","¿Incluye transporte?":"Sí","Documentación":"Parcial","Tracción":"Ruedas 4x4","Medidas de transporte":"2,5 – 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'a80dc838-0ab8-5ef5-b59d-4d5f65e079b5',
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'Rodillo Hamm HD 14 · tandem · 2.750 horas',
  'Rodillo tandem Hamm HD 14 de 1,4 m, con vibración de doble amplitud y sistema de raspado de tambor.

2.750 horas en obra vial catalana. Sistema de agua con bomba y boquillas funcionando (imprescindible para asfalto), depósito de 700 l.

Rodamientos de tambor revisados, sin fugas de aceite hidráulico. Carrocería con uso de obra, sin golpes en voladizos.

Factura y CE disponibles, libro parcial. Apta para empresas de asfaltado que busquen máquina de apoyo sin invertir en nueva.',
  (select id from public.categorias where nombre = 'obra'),
  'Compactación',
  'Hamm HD 14',
  'HD 14',
  'Bueno',
  22400::numeric, 22400::numeric, 22400::numeric,
  'Cataluña', 'Barcelona',
  '/images/anuncios/hamm-hd-14-1.webp',
  array['/images/anuncios/hamm-hd-14-1.webp', '/images/anuncios/hamm-hd-14-2.webp', '/images/anuncios/hamm-hd-14-3.webp']::text[],
  true,
  false,
  null,
  189,
  now() - interval '480 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2016","Horas de uso":"2750","Combustible":"Diésel","Potencia (CV)":"100","Peso (kg)":"7500","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Ruedas 4x4","Medidas de transporte":"2,5 – 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '421cbfed-f66d-54b0-8858-3cae99fab2a3',
  'b61db78a-1df1-53ea-accf-2adf671dd0cb',
  'Plataforma de tijera Genie GS-2630 · eléctrica',
  'Plataforma elevadora de tijera Genie GS-2630: 7,80 m de altura de trabajo, 2,30 m de ancho de plataforma y capacidad de 320 kg. Eléctrica, apta para interior.

Baterías de tracción agotadas al 80% de su vida (informe de carga incluido), cargador externo de 24 V operativo. Sistema hidráulico sin fugas, válvulas de emergencia probadas.

Barandillas extensibles, cuña antivuelco y alarmas de inclinación verificadas en última revisión anual.

Factura, manual y certificado de conformidad CE. La ideal para fontanería, electricidad y mantenimiento de naves; se puede alquilar antes de comprarla (consultar condiciones).',
  (select id from public.categorias where nombre = 'obra'),
  'Plataformas elevadoras',
  'Genie GS-2630',
  'GS-2630',
  'Bueno',
  9800::numeric, 9800::numeric, 9800::numeric,
  'Cataluña', 'Barcelona',
  '/images/anuncios/genie-gs-2630-1.webp',
  array['/images/anuncios/genie-gs-2630-1.webp', '/images/anuncios/genie-gs-2630-2.webp', '/images/anuncios/genie-gs-2630-3.webp']::text[],
  true,
  false,
  null,
  267,
  now() - interval '96 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'profesional',
  '{"Año":"2019","Horas de uso":"640","Combustible":"Diésel","Potencia (CV)":"3","Peso (kg)":"2350","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Ruedas 4x2","Medidas de transporte":"Hasta 2,5 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '76018b8c-1298-57a0-a808-1d4e42ae2bfd',
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'Tijera articulada Genie S-65 · 19,8 m · diésel',
  'Plataforma articulada Genie S-65 de 19,80 m de altura de trabajo con brazo extensible y giro de plataforma de 360°.

Motor diésel Stage IIIA con 1.150 horas, batería de arranque nueva y neumáticos de campo al 70%. Sistema de seguridad redundante (interruptor de cuerpo, antivuelco y alarmas) certificado en última revisión.

Plataforma con mando de girador y extensión hidráulica. Estructura sin reparaciones; pintura de fábrica con marcas de uso.

Conformidad CE con declaración del fabricante y manual. Revisión anual al día (certificado). Máquina para trabajos en altura serios: fachadas, industria y electricidad aérea.',
  (select id from public.categorias where nombre = 'obra'),
  'Plataformas elevadoras',
  'Genie S-65',
  'S-65',
  'Bueno',
  26900::numeric, 26900::numeric, 26900::numeric,
  'Andalucía', 'Sevilla',
  '/images/anuncios/genie-s-65-1.webp',
  array['/images/anuncios/genie-s-65-1.webp', '/images/anuncios/genie-s-65-2.webp', '/images/anuncios/genie-s-65-3.webp']::text[],
  true,
  false,
  null,
  311,
  now() - interval '300 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2017","Horas de uso":"1150","Combustible":"Diésel","Potencia (CV)":"45","Peso (kg)":"7900","¿Incluye transporte?":"Sí","Documentación":"Declaración CE / ficha técnica","Tracción":"Ruedas 4x4","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'c834a437-2ca5-54af-bbc7-a16e11452d5c',
  '9fd84107-d448-5137-814d-ba167aebd603',
  'Haulotte HA20 LT · 20 m · baterías nuevas',
  'Haulotte HA20 LT, plataforma articulada de 20 m montada sobre oruga de goma — trabaja en interior y en terreno irregular sin dañar el firmed.

Baterías de tracción REEMPLAZADAS hace 3 meses (factura de las celdas incluida), autonomía completa de jornada. Control en plataforma y en base funcionando, alarmas y paradas de emergencia probadas.

410 horas reales: casi toda en mantenimiento de fachadas. Orugas de goma al 85%.

Factura, manual y CE en regla. Se entrega tras revisión completa en nuestro taller, con 3 meses de garantía mecánica. Un gustazo de máquina para comunidades y empresas de limpieza.',
  (select id from public.categorias where nombre = 'obra'),
  'Plataformas elevadoras',
  'Haulotte HA20 LT',
  'HA20 LT',
  'Como nuevo',
  14500::numeric, 14500::numeric, 14500::numeric,
  'Castilla-La Mancha', 'Albacete',
  '/images/anuncios/ha20-lt-1.webp',
  array['/images/anuncios/ha20-lt-1.webp', '/images/anuncios/ha20-lt-2.webp', '/images/anuncios/ha20-lt-3.webp']::text[],
  true,
  false,
  null,
  295,
  now() - interval '48 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2020","Horas de uso":"410","Combustible":"Diésel","Potencia (CV)":"3","Peso (kg)":"6600","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Tracción":"Ruedas 4x4","Medidas de transporte":"Más de 4 m"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'c3929a7a-899a-5321-90c1-4c561c99d724',
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'Rotomartillo Bosch GBH 5-40 DCE · profesional',
  'Rotomartillo Bosch GBH 5-40 DCE de 1.200 W con mandril SDS-Max, para taladrado y demolición de hasta 40 mm en hormigón.

Uso de taller, dos años de servicio. Carbones al 70%, rodamiento suave y cable de alimentación sin reparaciones. Disponible con caja de transporte y punta escalopada original.

Factura y garantía del distribuidor (si queda) transferibles. Se prueba antes de llevar. Ideal para instaladores y reformistas que necesitan herramienta de fábrica sin precio de nueva.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Herramienta eléctrica',
  'Bosch',
  'GBH 5-40 DCE',
  'Bueno',
  315::numeric, 315::numeric, 315::numeric,
  'Andalucía', 'Sevilla',
  '/images/anuncios/bosch-gbh-5-40-1.webp',
  array['/images/anuncios/bosch-gbh-5-40-1.webp', '/images/anuncios/bosch-gbh-5-40-2.webp', '/images/anuncios/bosch-gbh-5-40-3.webp']::text[],
  true,
  false,
  null,
  189,
  now() - interval '72 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2021","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"1.7","Peso (kg)":"5.4","¿Incluye transporte?":"No","Documentación":"Factura y libro de instrucciones","Potencia (W)":"1.000 – 2.500 W","Tensión":"230 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '23fa0c9f-4a8c-585c-9c4a-ea26728a2676',
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'Sierra circular DeWalt DCS575 · batería 54V',
  'Siura circular inalámbrica DeWalt FlexVolt DCS575 de 54 V, disco de 184 mm, con dos baterías de 6,0 Ah y cargador rápido.

Poco uso: comprada para una obra concreta de tres meses. Sin golpes, disco original con pocos cortes, seguro de disco y base de corte rectas.

Factura, caja del sistema TSTAK y todos los accesorios de fábrica. Las baterías cargan al 100% y aguantan jornada completa de carpintería.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Herramienta eléctrica',
  'DeWalt',
  'DCS575',
  'Como nuevo',
  285::numeric, 285::numeric, 285::numeric,
  'Andalucía', 'Sevilla',
  '/images/anuncios/dewalt-dcs575-1.webp',
  array['/images/anuncios/dewalt-dcs575-1.webp', '/images/anuncios/dewalt-dcs575-2.webp', '/images/anuncios/dewalt-dcs575-3.webp']::text[],
  true,
  false,
  null,
  224,
  now() - interval '30 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2023","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"1.9","Peso (kg)":"3.1","¿Incluye transporte?":"No","Documentación":"Factura y libro de instrucciones","Potencia (W)":"500 – 1.000 W","Tensión":"Batería","Batería incluida":"Sí"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '37fb5822-9255-5528-9112-670bacca48fe',
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'Demolidor Hilti TE 60-ATC/AVR · con maletín',
  'Demolidor Hilti TE 60-ATC con activación de control de retroceso (ATC) y reducción activa de vibración: la herramienta de referencia para trabajos pesados de instalación.

Revisado en servicio oficial hace 500 horas: carbones, rodamientos y cable nuevo. Maletín Hilti con dos picos pico rompedor y una cincel punta.

Sin factura (parcial): tenemos el libro de servicio y los registros de taller de Hilti. Garantía de nuestro taller de 2 meses en electromecánica.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Herramienta eléctrica',
  'Hilti',
  'TE 60-ATC',
  'Bueno',
  980::numeric, 980::numeric, 980::numeric,
  'Aragón', 'Zaragoza',
  '/images/anuncios/hilti-te-60-1.webp',
  array['/images/anuncios/hilti-te-60-1.webp', '/images/anuncios/hilti-te-60-2.webp', '/images/anuncios/hilti-te-60-3.webp']::text[],
  true,
  false,
  null,
  267,
  now() - interval '200 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2020","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"2.1","Peso (kg)":"7.3","¿Incluye transporte?":"No","Documentación":"Parcial","Potencia (W)":"1.000 – 2.500 W","Tensión":"230 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'ec2663b4-d09b-5fee-8e91-d93302640f29',
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'Sierra de inglete Festool TS 55 F + guía FS 1400',
  'Sierra de canto Festool TS 55 F con riel guía FS 1400, freno de motor y aspiración de polvo: el estándar de carpintería e instalación de cocina.

Adquirida hace un año para un único proyecto; prácticamente nueva, sin golpes y con disco de dientes de carburo original con menos del 10% de uso.

Factura con garantía de fabricante restante (registrable), maletín Systainer 3 y guía completa. Se puede probar en nuestra sede de Zaragoza.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Herramienta eléctrica',
  'Festool',
  'TS 55 F',
  'Como nuevo',
  540::numeric, 540::numeric, 540::numeric,
  'Aragón', 'Zaragoza',
  '/images/anuncios/festool-ts-55-1.webp',
  array['/images/anuncios/festool-ts-55-1.webp', '/images/anuncios/festool-ts-55-2.webp', '/images/anuncios/festool-ts-55-3.webp']::text[],
  true,
  false,
  null,
  178,
  now() - interval '14 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2024","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"1.6","Peso (kg)":"4.5","¿Incluye transporte?":"No","Documentación":"Factura y libro de instrucciones","Potencia (W)":"500 – 1.000 W","Tensión":"230 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'f4268e6c-ce5a-507e-93ba-fdbb3d69d229',
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'Grupo electrógeno Kipor KDE 20 · 20 kVA · trifásico',
  'Grupo electrógeno Kipor KDE 20 de 20 kVA trifásico, con motor diésel de 1.240 horas en apagones y eventos.

Tablero con protección magneto-térmica y arranque eléctrico, ATS opcional disponible por diferencia. Sonorización de 68 dB(A) a 7 m, apto para obra urbana con horario.

Mantenimiento al día (aceite, filtros y válvulas facturados a las 1.000 h). Alternador sin historial de averías.

Factura, manual y CE de fábrica. Se entrega con batería nueva y probado bajo carga de 15 kW antes de la entrega.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Motores y generadores',
  'Kipor',
  'KDE 20',
  'Bueno',
  5450::numeric, 5450::numeric, 5450::numeric,
  'Aragón', 'Zaragoza',
  '/images/anuncios/kipor-kde20-1.webp',
  array['/images/anuncios/kipor-kde20-1.webp', '/images/anuncios/kipor-kde20-2.webp', '/images/anuncios/kipor-kde20-3.webp']::text[],
  true,
  false,
  null,
  302,
  now() - interval '60 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2019","Horas de uso":"1240","Combustible":"Diésel","Potencia (CV)":"40","Peso (kg)":"620","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Potencia (W)":"Más de 2.500 W","Tensión":"400 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'e5d72c1a-f581-54f7-9199-cf5542a5f0f2',
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'Himoinsa HFW-60 · 50 kVA · silencioso',
  'Grupo silencioso Himoinsa HFW-60 de 50 kVA, de los que van en obras y eventos donde el ruido importa (72 dB(A) a 7 m).

890 horas, motor Mitsubishi con mantenimiento por libro y panel de control automático con arranque remoto. Chasis con enganche de mano para moverlo en patio.

Carrocería sin óxido estructural, cerraduras y bisagras completas. Aceite y filtros recién cambiados.

CE y declaración de conformidad; factura original no conservada (parcial). Prueba bajo carga certificada antes de la entrega. Precio a contraentrega en Zaragoza.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Motores y generadores',
  'Himoinsa',
  'HFW-60',
  'Bueno',
  11900::numeric, 11900::numeric, 11900::numeric,
  'Aragón', 'Zaragoza',
  '/images/anuncios/himoinsa-hfw60-1.webp',
  array['/images/anuncios/himoinsa-hfw60-1.webp', '/images/anuncios/himoinsa-hfw60-2.webp', '/images/anuncios/himoinsa-hfw60-3.webp']::text[],
  true,
  false,
  null,
  341,
  now() - interval '360 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2020","Horas de uso":"890","Combustible":"Diésel","Potencia (CV)":"65","Peso (kg)":"1150","¿Incluye transporte?":"Sí","Documentación":"Declaración CE / ficha técnica","Potencia (W)":"Más de 2.500 W","Tensión":"400 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'bb3ba2ef-e35f-584f-9684-2bb8cc9d1def',
  '9fd84107-d448-5137-814d-ba167aebd603',
  'Honda EU70is · 7 kVA inverter · prácticamente nuevo',
  'Honda EU70is, generador inverter de 7.000 W de onda pura: suficiente para obra pequeña, furgón de servicios y domicilios en obras de reforma.

Solo 60 horas de uso de emergencia. Onda sinusoidal limpia apta para equipos electrónicos y soldadura ligera por inversor.

Depósito sin corrosión, carburador limpio y batería de arranque nueva. Ruedas y asa plegables, panel con dos tomas de 230 V y una de 12 V.

Factura, manual y garantía de distribuidor transferible. La mejor opción de portátil en ocasión que se puede encontrar ahora mismo.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Motores y generadores',
  'Honda',
  'EU70is',
  'Como nuevo',
  1690::numeric, 1690::numeric, 1690::numeric,
  'Castilla-La Mancha', 'Albacete',
  '/images/anuncios/honda-eu70is-1.webp',
  array['/images/anuncios/honda-eu70is-1.webp', '/images/anuncios/honda-eu70is-2.webp', '/images/anuncios/honda-eu70is-3.webp']::text[],
  true,
  false,
  null,
  209,
  now() - interval '24 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2023","Horas de uso":"60","Combustible":"Diésel","Potencia (CV)":"12","Peso (kg)":"86","¿Incluye transporte?":"Sí","Documentación":"Factura y libro de instrucciones","Potencia (W)":"1.000 – 2.500 W","Tensión":"230 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '588ba442-6d0a-57c5-afa8-05036c76b071',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'Motosierra Husqvarna 560 XP · profesional',
  'Motosierra Husqvarna 560 XP de 50,4 cc, gama profesional de 3,8 CV con arranque reversible y freno de cadena de inercia.

480 horas de trabajo en poda urbana. Cilindro sin grietas, compresión fuerte (se prueba en frío), embrague centrifugo sin patinar. Barra de 18" con cadena nueva montada.

Amortiguadores de mango en buen estado, gatillo y seguro de banda operativos. Filtro y carburador limpios esta temporada.

Factura parcial (taller de reparaciones del 2023 incluida, no la compra). Cadena de repuesto y aceite de corte incluidos. Se puede probar arrancada en frío en Murcia.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Sierra y poda',
  'Husqvarna',
  '560 XP',
  'Bueno',
  590::numeric, 590::numeric, 590::numeric,
  'Murcia', 'Murcia',
  '/images/anuncios/husqvarna-560xp-1.webp',
  array['/images/anuncios/husqvarna-560xp-1.webp', '/images/anuncios/husqvarna-560xp-2.webp', '/images/anuncios/husqvarna-560xp-3.webp']::text[],
  true,
  false,
  null,
  254,
  now() - interval '40 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2021","Horas de uso":"480","Combustible":"Diésel","Potencia (CV)":"3.8","Peso (kg)":"5.9","¿Incluye transporte?":"No","Documentación":"Parcial","Potencia (W)":"1.000 – 2.500 W","Tensión":"Batería","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'a53a6b0c-acba-547c-8df2-0740f58f859f',
  '253fd85a-b3c2-5403-bb78-e90a5257cd34',
  'Motosierra Husqvarna 545 · 45 cc · con barra de 16"',
  'Motosierra Husqvarna 545 de 45 cc, tamaño medio perfecto para leña de casa, desramado y jardinería ligera.

610 horas registradas en el odómetro de horas. Arranca con un tirón corto, acelera limpio y frena bien (probada). Carburador ajustado hace dos meses.

Guardas completas, freno de cadena operativo y puntal correcto. Estética de uso: rayones normales en el carenado.

Sin papeles: se vende como herramienta de segunda mano con prueba de funcionamiento. Trae barra de 16" con cadena de diente cuadrado puesta.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Sierra y poda',
  'Husqvarna',
  '545',
  'Bueno',
  340::numeric, 340::numeric, 340::numeric,
  'Murcia', 'Murcia',
  '/images/anuncios/husqvarna-545-1.webp',
  array['/images/anuncios/husqvarna-545-1.webp', '/images/anuncios/husqvarna-545-2.webp', '/images/anuncios/husqvarna-545-3.webp']::text[],
  true,
  false,
  null,
  167,
  now() - interval '520 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2019","Horas de uso":"610","Combustible":"Diésel","Potencia (CV)":"2.7","Peso (kg)":"4.9","¿Incluye transporte?":"No","Documentación":"Sin documentación","Potencia (W)":"500 – 1.000 W","Tensión":"Batería","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  '7eb675dc-345a-5782-97a2-67458c4a0d43',
  '94704b6b-e9b1-59ac-9297-fb2a7bdc7ef7',
  'Juego de llaves y útiles Facom · 46 piezas',
  'Juego de herramienta manual Facom de 46 piezas: llaves combinadas, varetas con articulación, casquillos 1/2" y tapones de impacto.

Procede de nuestro taller; todas las piezas presentes (lista de contenido en foto) y con el desgaste propio del uso diario, sin piezas dobladas ni craked.

Caja metálica con cerradura y bandeja interior. Factura del distribuidor del 2018.

Oportunidad para montar un taller desde cero con herramienta de gama alta a precio de ocasión. Entrega en mano en Sevilla o envío peninsular.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Taller manual',
  'Facom',
  'Set 46',
  'Bueno',
  310::numeric, 310::numeric, 310::numeric,
  'Andalucía', 'Sevilla',
  '/images/anuncios/facom-46pz-1.webp',
  array['/images/anuncios/facom-46pz-1.webp', '/images/anuncios/facom-46pz-2.webp', '/images/anuncios/facom-46pz-3.webp']::text[],
  true,
  false,
  null,
  141,
  now() - interval '120 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2018","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"0.5","Peso (kg)":"12.5","¿Incluye transporte?":"No","Documentación":"Factura y libro de instrucciones","Potencia (W)":"Hasta 500 W","Tensión":"Bivolt","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();
insert into public.productos (
  id, user_id, titulo, descripcion, categoria_id, subcategoria, marca, modelo,
  estado, precio, precio_eur, precio_usd, ubicacion_estado, ubicacion_ciudad,
  imagen_url, imagenes, activo, destacado, destacado_hasta, visitas,
  creado_en, metodos_contacto, boosteado_en, estado_moderacion,
  vendedor_verificado, vendedor_tipo, especificaciones,
  verificacion_homologacion, verificacion_homologacion_revisada_en,
  reservado, es_demo
) values (
  'b28c1ffa-4b68-58d0-bec1-fa6c53e8ca69',
  '1de9a822-cb9b-5ae1-a8cd-d237d4b2580f',
  'Mezclador de obra eléctrico + picadora · set',
  'Set de obra: mezclador eléctrico de 1.400 W con varilla de 120 mm y picadora manual para sacos de mortero.

Herramienta de albañilería con uso real: pintura saltada y cable cambiado una vez (empalme en regla). Mezcla sin problemas en cubo de 100 l.

Sin papeles; se vende probado en tienda. Barata, lista para seguir dándole a la obra. Aceptamos recambio por herramienta mayor si viene al taller de Zaragoza.',
  (select id from public.categorias where nombre = 'herramientas'),
  'Taller manual',
  'Facom',
  'Mezclador',
  'Usado',
  240::numeric, 240::numeric, 240::numeric,
  'Aragón', 'Zaragoza',
  '/images/anuncios/mezclador-set-1.webp',
  array['/images/anuncios/mezclador-set-1.webp', '/images/anuncios/mezclador-set-2.webp', '/images/anuncios/mezclador-set-3.webp']::text[],
  true,
  false,
  null,
  98,
  now() - interval '660 hours',
  '{}'::jsonb,
  null,
  'aprobado',
  false,
  'camperizador',
  '{"Año":"2017","Horas de uso":"0","Combustible":"Diésel","Potencia (CV)":"1.4","Peso (kg)":"8.2","¿Incluye transporte?":"No","Documentación":"Sin documentación","Potencia (W)":"500 – 1.000 W","Tensión":"230 V","Batería incluida":"No"}'::jsonb,
  'sin_verificar',
  null,
  false,
  true
)
on conflict (id) do update
  set titulo = excluded.titulo,
      descripcion = excluded.descripcion,
      categoria_id = excluded.categoria_id,
      subcategoria = excluded.subcategoria,
      marca = excluded.marca,
      modelo = excluded.modelo,
      estado = excluded.estado,
      precio = excluded.precio,
      precio_eur = excluded.precio_eur,
      precio_usd = excluded.precio_usd,
      ubicacion_estado = excluded.ubicacion_estado,
      ubicacion_ciudad = excluded.ubicacion_ciudad,
      imagen_url = excluded.imagen_url,
      imagenes = excluded.imagenes,
      destacado = excluded.destacado,
      destacado_hasta = excluded.destacado_hasta,
      visitas = excluded.visitas,
      boosteado_en = excluded.boosteado_en,
      vendedor_tipo = excluded.vendedor_tipo,
      especificaciones = excluded.especificaciones,
      verificacion_homologacion = excluded.verificacion_homologacion,
      actualizado_en = now();

commit;

-- Verificación rápida (debe devolver 37):
-- select count(*) from productos where es_demo;
