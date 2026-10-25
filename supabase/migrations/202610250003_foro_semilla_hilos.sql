-- Fase 12B: semilla de ~9 hilos del foro con la cuenta del equipo.
-- Autor: cuenta del equipo (Gtrespana). Ya aplicado en producción (2026-10-25).
-- Idempotente por id fijo:
-- re-ejecutar no duplica ni toca fechas de hilos existentes.

insert into public.foro_hilos (id, categoria_id, user_id, titulo, cuerpo, estado_moderacion, cerrado, mensajes_count, creado_en, actualizado_en)
select v.id::uuid, c.id, 'e80534be-7698-4aa8-bf37-268903457a90'::uuid, v.titulo, v.cuerpo, 'aprobado', false, 0, v.creado_en::timestamptz, v.creado_en::timestamptz
from (values
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'compra',
   '¿Cuánto es razonable por un excavador compacto de 2018 con 2.500 horas?',
   'Estoy mirando un excavador compacto del 2018 con unas 2.500 horas, motor en buen estado y sin fugas. Me piden 32.000 €. He comparado anuncios parecidos pero las variaciones son enormes, entre 26.000 y 38.000 €. ¿Cómo lo aterrizáis vosotros: por horas, por modelo o por lo que pide el mercado ahora mismo? Añado que es particular y no trae facturas de mantenimiento.',
   now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000002'::uuid, 'compra',
   '¿Comprar a particular o con garantía de distribuidor? Mi caso concreto',
   'Tengo presupuesto para un tractor de media potencia (110-130 CV). Un distribuidor me ofrece uno con 12 meses de garantía y financiación, y un particular uno dos años más barato pero sin papeles de mantenimiento. ¿Cómo valoráis el riesgo real de comprar fuera de red? He leído que el ahorro inicial se puede comer un solo fallo de bomba hidráulica.',
   now() - interval '5 days'),
  ('a1000000-0000-4000-8000-000000000003'::uuid, 'taller',
   'El minicargador no levanta lo que antes: ¿bomba o motor?',
   'Tengo un minicargador de ruedas que hace dos meses levantaba la pala sin problema y ahora cuesta mucho con cargas medias. El aceite está limpio y al nivel, pero noto el ruido fuerte al subir. ¿Cómo distinguís un problema de bomba hidráulica de simplemente motor flojo o filtros tapados? Cualquier consejo de diagnóstico antes de llevarlo al taller me sirve.',
   now() - interval '3 days'),
  ('a1000000-0000-4000-8000-000000000004'::uuid, 'taller',
   '¿Qué revisar antes de comprar un bulldozer de segunda mano?',
   'Voy a ver un bulldozer de ocasión el jueves. Ya sé lo básico (horquillas, cadenas, fugas), pero ¿qué os ha dado más problemas a la hora de comprar? Es de un particular con 6.000 horas y no tengo mecánico de confianza cerca. Si me podéis dejar una checklist corta de los puntos críticos os lo agradecería.',
   now() - interval '7 days'),
  ('a1000000-0000-4000-8000-000000000005'::uuid, 'marcas',
   'John Deere 6M vs Valtra N: ¿cuál aguanta mejor 8.000 horas al año?',
   'Llevo tres temporadas alquilando y quiero pasar a propiedad. Trabajo unas 8.000 horas al año (labranza y transporte corto). Me decanto entre una gama media John Deere 6M y una Valtra N del mismo año. En precio la Valtra sale mejor, pero no conozco a alguien que lleve muchos años con las dos. ¿Qué os parece más robusto a largo plazo y cómo está el servicio técnico en vuestros territorios?',
   now() - interval '4 days'),
  ('a1000000-0000-4000-8000-000000000006'::uuid, 'marcas',
   'Experiencias con generadores Diessi: ¿alguna queja?',
   'Busco un generador diésel portátil para la explotación (uso intermitente, picos de consumo en la siega). He estado mirando varias marcas y una que aparece mucho es Diessi, pero no encuentro opiniones recientes. ¿Alguien tiene uno en servicio? ¿Ruido, consumo, repuestos? Cualquier dato real de campo me vale más que las fichas técnicas.',
   now() - interval '9 days'),
  ('a1000000-0000-4000-8000-000000000007'::uuid, 'venta',
   '¿Fotos que más venden: máquina fría o trabajando en campo?',
   'Estoy preparando el anuncio de un tractor y no sé si invertir la tarde en fotos «de catálogo» (limpio, buen sol, fondo neutro) o sacarle unas cuantas trabajando. En los anuncios que más me convencen a mí aparecen las dos. ¿Qué funciona mejor en esta web? Si alguien tiene experiencia de ventas, ¿le dais más vueltas al titular o a la primera foto?',
   now() - interval '6 days'),
  ('a1000000-0000-4000-8000-000000000008'::uuid, 'venta',
   '¿Publicar con precio cerrado o «consultar precio»? ¿Qué convierte más?',
   'Tengo tres excavadores para vender y el rango de precios es amplio según el estado. Me tienta poner «consultar precio» para filtrar curiosos, pero también me da la sensación de que la gente se va si no ve cifra. ¿Cómo lo gestionáis vosotros? ¿Mostráis el precio desde el principio aunque sea alto para dejar margen de negociación?',
   now() - interval '8 days'),
  ('a1000000-0000-4000-8000-000000000009'::uuid, 'general',
   'Presentaciones: quiénes somos y qué maquinaria trabajáis',
   'Ábrenos este espacio para conocernos. Contad de qué zona sois, con qué maquinaria trabajáis y qué buscáis en el foro: comprar, vender, resolver averías o simplemente comparar modelos. Empezamos yo: somos un equipo dedicado a la maquinaria de ocasión y aquí estaremos para resolver dudas de compra, venta y mantenimiento.',
   now() - interval '10 days')
) as v(id, cat_slug, titulo, cuerpo, creado_en)
join public.foro_categorias c on c.slug = v.cat_slug
on conflict (id) do nothing;
