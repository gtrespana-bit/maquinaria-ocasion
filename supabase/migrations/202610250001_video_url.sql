-- Fase 10 (video en ficha): URL de vídeo del anuncio.
-- Solo los planes de pago pueden rellenarlo (lo decide la app en el form de
-- publicar/edición y lo refuerza /api/publicar y /api/productos/editar);
-- la ficha lo embebe si existe.
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS video_url text;

COMMENT ON COLUMN public.productos.video_url IS
  'Enlace de vídeo del anuncio (YouTube/Vimeo/Drive u otro). Opcional; planes de pago.';
